import { redirect } from "next/navigation";
import { appDirectory } from "@/lib/appDirectory";

/**
 * `/guidelines` is kept as a stable entry point (it is linked from the header,
 * footer and homepage) and lands on the first guideline in the directory.
 */
const page = () => {
  redirect(`/guidelines/${appDirectory[0].slug}`);
};

export default page;
