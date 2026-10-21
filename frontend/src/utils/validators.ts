/**
 * Reglas de validación reutilizables para formularios.
 *
 * Cada regla es una función que recibe el valor y devuelve un
 * `ValidationResult`. Las reglas configurables devuelven un `Validator`,
 * de modo que se puedan componer con `validateField` o `validateForm`.
 */

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export type Validator = (value: unknown) => ValidationResult;

export interface PasswordChecks {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
}

export interface PasswordOptions {
  minLength?: number;
  requireUpper?: boolean;
  requireLower?: boolean;
  requireNumber?: boolean;
}

export interface FormValidationResult<T extends Record<string, unknown>> {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
  firstError: { field: keyof T; message: string } | null;
}

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const toText = (value: unknown): string => (value == null ? "" : String(value));

export const valid = (): ValidationResult => ({ valid: true, message: "" });

export const invalid = (message: string): ValidationResult => ({ valid: false, message });

/** Valida que el valor no esté vacío (los espacios no cuentan). */
export const required =
  (message = "Este campo es obligatorio"): Validator =>
  (value) =>
    toText(value).trim() ? valid() : invalid(message);

/** Valida una longitud mínima, ignorando espacios al inicio y al final. */
export const minLength =
  (min: number, message = `Debe tener al menos ${min} caracteres`): Validator =>
  (value) => {
    const text = toText(value).trim();
    if (text.length < min) return invalid(message);
    return valid();
  };

/** Valida una longitud máxima, ignorando espacios al inicio y al final. */
export const maxLength =
  (max: number, message = `Debe tener como máximo ${max} caracteres`): Validator =>
  (value) => {
    const text = toText(value).trim();
    if (text.length > max) return invalid(message);
    return valid();
  };

/** Valida que la longitud esté dentro de un rango inclusivo. */
export const lengthBetween =
  (
    min: number,
    max: number,
    message = `Debe tener entre ${min} y ${max} caracteres`,
  ): Validator =>
  (value) => {
    const length = toText(value).trim().length;
    if (length < min || length > max) return invalid(message);
    return valid();
  };

/** Valida que el valor sea un número finito mayor que cero. */
export const positiveNumber =
  (message = "Debe ser un número mayor que cero"): Validator =>
  (value) => {
    if (value == null) return invalid(message);

    const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
    if (normalized === "") return invalid(message);

    const number = typeof normalized === "number" ? normalized : Number(normalized);
    if (!Number.isFinite(number) || number <= 0) return invalid(message);

    return valid();
  };

/** Valida el formato de un correo electrónico. */
export const email =
  (message = "Ingresa un correo electrónico válido"): Validator =>
  (value) => {
    const text = toText(value).trim();
    if (!EMAIL_PATTERN.test(text)) return invalid(message);
    return valid();
  };

/** Devuelve qué requisitos cumple una contraseña. */
export const getPasswordChecks = (
  value: unknown,
  minLengthValue = PASSWORD_MIN_LENGTH,
): PasswordChecks => {
  const password = toText(value);

  return {
    minLength: password.length >= minLengthValue,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
};

/** Cantidad de requisitos de contraseña cumplidos (0 a 4). */
export const getPasswordStrength = (
  value: unknown,
  minLengthValue = PASSWORD_MIN_LENGTH,
): number => Object.values(getPasswordChecks(value, minLengthValue)).filter(Boolean).length;

/** Indica si la contraseña cumple todos los requisitos por defecto. */
export const isPasswordStrong = (
  value: unknown,
  minLengthValue = PASSWORD_MIN_LENGTH,
): boolean => getPasswordStrength(value, minLengthValue) === 4;

/** Valida que la contraseña sea segura según la política configurada. */
export const password =
  (options: PasswordOptions = {}): Validator =>
  (value) => {
    const {
      minLength: minLengthValue = PASSWORD_MIN_LENGTH,
      requireUpper = true,
      requireLower = true,
      requireNumber = true,
    } = options;

    const text = toText(value);
    if (!text) return invalid("La contraseña es obligatoria");

    const checks = getPasswordChecks(text, minLengthValue);
    const isValid =
      checks.minLength &&
      (!requireUpper || checks.hasUpper) &&
      (!requireLower || checks.hasLower) &&
      (!requireNumber || checks.hasNumber);

    if (isValid) return valid();

    const requirements = [`al menos ${minLengthValue} caracteres`];
    if (requireUpper) requirements.push("una mayúscula");
    if (requireLower) requirements.push("una minúscula");
    if (requireNumber) requirements.push("un número");

    return invalid(`La contraseña debe tener ${requirements.join(", ")}`);
  };

/** Ejecuta las reglas en orden y devuelve el primer resultado inválido. */
export const validateField = (
  value: unknown,
  validators: Validator | Validator[] = [],
): ValidationResult => {
  const rules = Array.isArray(validators) ? validators : [validators];

  for (const validate of rules) {
    const result = validate(value);
    if (!result.valid) return result;
  }

  return valid();
};

/** Valida varios campos y devuelve los errores junto con el primero encontrado. */
export const validateForm = <T extends Record<string, unknown>>(
  values: T,
  schema: { [K in keyof T]?: Validator | Validator[] },
): FormValidationResult<T> => {
  const errors: Partial<Record<keyof T, string>> = {};
  let firstError: FormValidationResult<T>["firstError"] = null;

  for (const field of Object.keys(schema) as (keyof T)[]) {
    const result = validateField(values[field], schema[field]);

    if (!result.valid) {
      errors[field] = result.message;
      if (!firstError) firstError = { field, message: result.message };
    }
  }

  return { valid: firstError === null, errors, firstError };
};

/** Conjunto de reglas para importar y usar directamente en cualquier página. */
export const rules = {
  required,
  minLength,
  maxLength,
  lengthBetween,
  positiveNumber,
  password,
  email,
};

export default rules;
