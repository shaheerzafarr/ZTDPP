import AfterLoginShell from "@/components/layout/AfterLoginShell";

export default function AppLayout({ children }) {
  return <AfterLoginShell mode="user">{children}</AfterLoginShell>;
}
