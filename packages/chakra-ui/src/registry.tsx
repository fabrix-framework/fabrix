import { ComponentRegistry } from "@fabrix-framework/fabrix";
import { ImagePreview } from "@components/ImagePreview";
import { ChakraReactTable } from "./components/default/table";
import { ChakraFormField, ChakraForm } from "./components/default/form";
import { ChakraField } from "./components/default/field";

export const defaultComponents = {
  table: ChakraReactTable,
  form: ChakraForm,
  formField: ChakraFormField,
  field: ChakraField,
};

export const ChakraUIRegistry = new ComponentRegistry({
  default: defaultComponents,
  custom: [
    {
      type: "field",
      name: "ImagePreview",
      component: ImagePreview,
    },
  ],
});
