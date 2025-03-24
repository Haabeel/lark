"use client";

import React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";

interface FormInputFieldBaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
  type?: string;
  showPassword?: boolean;
  onToggle?: () => void;
}

type ToggleProps =
  | { onToggle: () => void; showPassword: boolean }
  | { onToggle?: never; showPassword?: never };

type FormInputFieldProps<T extends FieldValues> = FormInputFieldBaseProps<T> &
  ToggleProps;

const FormInputField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  showPassword,
  onToggle,
}: FormInputFieldProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div
              className={`group relative h-10 rounded-md border border-input transition-colors duration-200 focus-within:border-primary`}
            >
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
                className="h-10 border-0 pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {showPassword !== undefined && onToggle && (
                <Button
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
                  onClick={onToggle}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-auto" />
                  ) : (
                    <Eye className="h-4 w-auto" />
                  )}
                </Button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormInputField;
