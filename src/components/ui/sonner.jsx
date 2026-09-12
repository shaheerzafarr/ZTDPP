import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

import classes from "./sonner.module.css";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className={classes.toaster}
      toastOptions={{
        classNames: {
          toast: classes.toast,
          description: classes.description,
          actionButton: classes.actionButton,
          cancelButton: classes.cancelButton,
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
