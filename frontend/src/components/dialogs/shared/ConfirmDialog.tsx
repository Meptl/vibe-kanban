import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { defineModal, type ConfirmResult } from '@/lib/modals';
import { useEffect, useState } from 'react';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'info' | 'success';
  icon?: boolean;
  checkboxLabel?: string;
  checkboxDescription?: string;
  checkboxDefaultChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
}

const ConfirmDialogImpl = NiceModal.create<ConfirmDialogProps>((props) => {
  const modal = useModal();
  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    icon = true,
    checkboxLabel,
    checkboxDescription,
    checkboxDefaultChecked = false,
    onCheckboxChange,
  } = props;
  const [isChecked, setIsChecked] = useState(checkboxDefaultChecked);

  useEffect(() => {
    if (!modal.visible) return;
    setIsChecked(checkboxDefaultChecked);
  }, [checkboxDefaultChecked, modal.visible]);

  const handleConfirm = () => {
    modal.resolve('confirmed' as ConfirmResult);
  };

  const handleCancel = () => {
    modal.resolve('canceled' as ConfirmResult);
  };

  const getIcon = () => {
    if (!icon) return null;

    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <XCircle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getConfirmButtonVariant = () => {
    return variant === 'destructive' ? 'destructive' : 'default';
  };

  const hasCheckbox = Boolean(checkboxLabel);

  return (
    <Dialog open={modal.visible} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        {hasCheckbox && (
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm-dialog-checkbox"
              checked={isChecked}
              onCheckedChange={(checked) => {
                const nextChecked = checked === true;
                setIsChecked(nextChecked);
                onCheckboxChange?.(nextChecked);
              }}
            />
            <div className="space-y-1">
              <Label
                htmlFor="confirm-dialog-checkbox"
                className="cursor-pointer text-sm font-medium"
              >
                {checkboxLabel}
              </Label>
              {checkboxDescription && (
                <p className="text-xs text-muted-foreground">
                  {checkboxDescription}
                </p>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button variant={getConfirmButtonVariant()} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const ConfirmDialog = defineModal<ConfirmDialogProps, ConfirmResult>(
  ConfirmDialogImpl
);
