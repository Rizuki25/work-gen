import type { InputFieldDefinition, InputFieldHintVariant } from '../../modules/contracts'

export function resolveFieldHint(
  field: InputFieldDefinition,
  inputValues: Readonly<Record<string, string>>,
): InputFieldHintVariant {
  const hintConfig = field.hintByFieldValue
  const selectedValue = hintConfig ? inputValues[hintConfig.fieldId] : undefined
  const selectedHint = selectedValue ? hintConfig?.values[selectedValue] : undefined

  return {
    placeholder: selectedHint?.placeholder ?? field.placeholder,
    helpText: selectedHint?.helpText ?? field.helpText,
  }
}
