import React, { forwardRef } from "react";

export const Table = forwardRef(({ className, ...props }, ref) => {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      />
    </div>
  );
});
Table.displayName = "Table";

export const TableHeader = forwardRef(({ className, ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={`[&_tr]:border-b ${className}`}
      {...props}
    />
  );
});
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef(({ className, ...props }, ref) => {
  return (
    <tbody
      ref={ref}
      className={`[&_tr:last-child]:border-0 ${className}`}
      {...props}
    />
  );
});
TableBody.displayName = "TableBody";

export const TableFooter = forwardRef(({ className, ...props }, ref) => {
  return (
    <tfoot
      ref={ref}
      className={`border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 ${className}`}
      {...props}
    />
  );
});
TableFooter.displayName = "TableFooter";

export const TableRow = forwardRef(({ className, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}
      {...props}
    />
  );
});
TableRow.displayName = "TableRow";

export const TableHead = forwardRef(({ className, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
});
TableHead.displayName = "TableHead";

export const TableCell = forwardRef(({ className, ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
});
TableCell.displayName = "TableCell";

export const TableCaption = forwardRef(({ className, ...props }, ref) => {
  return (
    <caption
      ref={ref}
      className={`mt-4 text-sm text-muted-foreground ${className}`}
      {...props}
    />
  );
});
TableCaption.displayName = "TableCaption";
