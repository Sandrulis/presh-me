import { redirect } from "next/navigation";

/** Vecais ceļš — pāradresē uz `/terms`. */
export default function RulesRedirectPage() {
  redirect("/terms");
}
