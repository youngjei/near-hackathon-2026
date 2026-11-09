"""Unfunded API research: fresh auth proof, dry quotes, optional public address allocation.
Never loads wallet keys, sends funds, or calls submit-intent/deposit endpoints.
"""
import argparse
import base64
import json
import os
from pathlib import Path
import subprocess
import struct
import time
import urllib.parse
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

BASE = 'https://1click.chaindefuser.com'
ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'


def b58(data):
    number, encoded = int.from_bytes(data, 'big'), ''
    while number:
        number, remainder = divmod(number, 58)
        encoded = ALPHABET[remainder] + encoded
    return '1' * (len(data) - len(data.lstrip(b'\0'))) + encoded


def http(url, payload=None, headers=None):
    # Feed headers through stdin, keeping ephemeral bearer tokens out of argv.
    def quote_config(value):
        return '"' + value.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r') + '"'
    config = ['url = ' + quote_config(url)]
    for name, value in {'Content-Type': 'application/json', **(headers or {})}.items():
        config.append('header = ' + quote_config(name + ': ' + value))
    if payload is not None:
        config.append('data = ' + quote_config(json.dumps(payload)))
    response = subprocess.run(
        ['curl', '-sS', '--max-time', '35', '--write-out', '\n%{http_code}', '--config', '-'],
        input='\n'.join(config), capture_output=True, text=True, check=True)
    body, _, status = response.stdout.rpartition('\n')
    try:
        value = json.loads(body)
    except ValueError:
        value = {'non_json_response': True}
    return int(status), value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allocate-public', action='store_true',
                        help='Also allocate one public quote without funding it.')
    parser.add_argument('--output', default='work/near-probe/results.json')
    args = parser.parse_args()
    results = {}

    def record(name, path, payload=None, headers=None, secret=False):
        status, response = http(BASE + path, payload, headers)
        # Always discard auth response values, including error responses.
        safe = {'response_keys': list(response)} if secret else response
        results[name] = {'http_status': status,
                         'retrieved_at': datetime.now(timezone.utc).isoformat(),
                         'response': safe}
        print(name, status, flush=True)
        target = Path(args.output)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(results, indent=2) + '\n')
        return status, response

    status, tokens = record('tokens', '/v0/tokens')
    if status != 200:
        raise RuntimeError('Could not load supported tokens')

    def asset(chain):
        return next(t['assetId'] for t in tokens
                    if t['symbol'] == 'USDC' and t['blockchain'] == chain)

    record('balances-no-auth', '/v0/account/balances')
    record('history-no-auth', '/v0/account/history')
    status, rpc = http('https://rpc.fastnear.com', {
        'jsonrpc': '2.0', 'id': 'splitdbill-read-only', 'method': 'query',
        'params': {'request_type': 'call_function', 'finality': 'final',
                   'account_id': 'intents.near', 'method_name': 'current_salt',
                   'args_base64': 'e30='}})
    if status != 200 or 'result' not in rpc:
        raise RuntimeError('Could not fetch current public verifier salt')
    salt = bytes.fromhex(json.loads(bytes(rpc['result']['result']).decode()))
    key = Ed25519PrivateKey.generate()
    public = key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    now_ms = int(time.time() * 1000)
    end_ms = now_ms + 300_000
    nonce = (bytes.fromhex('5628f6c6') + bytes([0]) + salt
             + struct.pack('<Q', end_ms * 1_000_000)
             + struct.pack('<Q', now_ms * 1_000_000) + os.urandom(7))
    payload = json.dumps({
        'signer_id': public.hex(), 'verifying_contract': 'intents.near',
        'deadline': datetime.fromtimestamp(end_ms / 1000, timezone.utc).isoformat(),
        'nonce': base64.b64encode(nonce).decode(), 'intents': []},
        separators=(',', ':'))
    status, auth = record('ephemeral-auth', '/v0/auth/authenticate', {
        'signedData': {'standard': 'raw_ed25519', 'payload': payload,
                       'public_key': 'ed25519:' + b58(public),
                       'signature': 'ed25519:' + b58(key.sign(payload.encode()))}},
        secret=True)
    if status not in (200, 201) or 'accessToken' not in auth:
        raise RuntimeError('Disposable ownership authentication failed')
    session = {'Authorization': 'Bearer ' + auth['accessToken']}
    record('balances-with-session', '/v0/account/balances', headers=session)
    record('history-with-session', '/v0/account/history', headers=session)
    quote = {
        'dry': True, 'swapType': 'EXACT_OUTPUT', 'slippageTolerance': 100,
        'originAsset': asset('base'), 'depositType': 'ORIGIN_CHAIN',
        'destinationAsset': asset('near'), 'amount': '15000000',
        'refundTo': '0x1111111111111111111111111111111111111111',
        'refundType': 'ORIGIN_CHAIN', 'recipient': public.hex(),
        'recipientType': 'CONFIDENTIAL_INTENTS',
        'deadline': (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
    for mode in ('public', 'basic', 'advanced'):
        quote['confidentiality'] = mode
        record('private-no-auth-' + mode, '/v0/quote', quote)
        record('private-session-' + mode, '/v0/quote', quote, session)
    quote.update(recipientType='DESTINATION_CHAIN', destinationAsset=asset('arb'),
                 recipient='0x2222222222222222222222222222222222222222')
    for mode in ('public', 'basic', 'advanced'):
        quote['confidentiality'] = mode
        record('external-' + mode, '/v0/quote', quote)
    if args.allocate_public:
        quote.update(dry=False, confidentiality='public')
        status, response = record('unfunded-public', '/v0/quote', quote)
        address = response.get('quote', {}).get('depositAddress')
        if status in (200, 201) and address:
            query = {'depositAddress': address}
            memo = response['quote'].get('depositMemo')
            if memo:
                query['depositMemo'] = memo
            record('unfunded-public-status', '/v0/status?' + urllib.parse.urlencode(query))
    print('Finished. No funds or spending intents submitted.')


if __name__ == '__main__':
    main()
