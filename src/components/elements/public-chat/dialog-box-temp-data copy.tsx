import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface DialogBoxTempDataProps {
  open: boolean;
  onClose: () => void;
  allowed : boolean;
}

const DialogBoxTempData: React.FC<DialogBoxTempDataProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog open={open} >
      <DialogContent className="sm:max-w-md bg-background rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            Your Info
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This name is temporary and used only for public chat.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Label htmlFor="username" className="text-sm text-foreground">
            Temporary Username
          </Label>
          <Input
            id="username"
            placeholder="e.g. Guest123"
            className="bg-muted/50 border border-border rounded-md focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button>
                create user
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default DialogBoxTempData;
