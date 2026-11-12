import { Shell } from "@/components/shell";
import { SavedBills } from "@/components/saved-bills";

export default function Bills() {
  return <Shell notice={null}><div className="flow"><div className="task-document"><SavedBills /></div></div></Shell>;
}
