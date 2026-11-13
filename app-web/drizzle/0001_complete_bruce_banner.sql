ALTER TABLE `bills` ADD `recipient_account` text;
--> statement-breakpoint
CREATE TRIGGER bill_recipient_immutable
BEFORE UPDATE OF recipient_account ON bills
WHEN NEW.recipient_account IS NOT OLD.recipient_account
BEGIN
 SELECT RAISE(ABORT, 'The receiving account is fixed for this bill');
END;
