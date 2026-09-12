import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";
import classes from "./resizable.module.css";

const ResizablePanelGroup = ({ className, ...props }) => (
  <ResizablePrimitive.PanelGroup className={cn(classes.panelGroup, className)} {...props} />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({ withHandle, className, ...props }) => (
  <ResizablePrimitive.PanelResizeHandle className={cn(classes.handle, className)} {...props}>
    {withHandle && (
      <div className={classes.grip}>
        <GripVertical className={classes.gripIcon} />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
