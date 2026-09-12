import AfterLoginShell from "@/components/layout/AfterLoginShell";

export default function AdminLayout({ children }) {
  return <AfterLoginShell mode="admin">{children}</AfterLoginShell>;
}
