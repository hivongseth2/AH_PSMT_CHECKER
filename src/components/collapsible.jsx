import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = React.forwardRef(function CollapsibleContent(
  { className, children, ...props },
  ref
) {
  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      className={`data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down ${className}`}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Content>
  );
});
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
