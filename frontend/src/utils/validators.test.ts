import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  email,
  getPasswordChecks,
  getPasswordStrength,
  isPasswordStrong,
  lengthBetween,
  maxLength,
  minLength,
  password,
  positiveNumber,
  required,
  rules,
  validateField,
  validateForm,
} from "./validators";

describe("required", () => {
  it("rechaza valores vacíos o solo con espacios", () => {
    expect(required()("")).toEqual({
      valid: false,
      message: "Este campo es obligatorio",
    });
    expect(required()("   ").valid).toBe(false);
    expect(required()(null).valid).toBe(false);
    expect(required()(undefined).valid).toBe(false);
  });

  it("acepta valores con contenido", () => {
    expect(required()("Lubix").valid).toBe(true);
    expect(required()(0).valid).toBe(true);
    expect(required()(false).valid).toBe(true);
  });

  it("permite personalizar el mensaje", () => {
    expect(required("El correo es obligatorio")("").message).toBe(
      "El correo es obligatorio",
    );
  });
});

describe("reglas de longitud", () => {
  it("minLength respeta el límite e ignora espacios externos", () => {
    expect(minLength(5)("  abc  ").valid).toBe(false);
    expect(minLength(5)(" abcde ").valid).toBe(true);
    expect(minLength(3, "Muy corto")("ab").message).toBe("Muy corto");
  });

  it("maxLength respeta el límite", () => {
    expect(maxLength(4)("abcd").valid).toBe(true);
    expect(maxLength(4)("abcde").valid).toBe(false);
  });

  it("lengthBetween valida un rango inclusivo", () => {
    const rule = lengthBetween(3, 5);
    expect(rule("ab").valid).toBe(false);
    expect(rule("abc").valid).toBe(true);
    expect(rule("abcde").valid).toBe(true);
    expect(rule("abcdef").valid).toBe(false);
  });
});

describe("positiveNumber", () => {
  it("acepta números mayores que cero", () => {
    expect(positiveNumber()(1).valid).toBe(true);
    expect(positiveNumber()(1.5).valid).toBe(true);
    expect(positiveNumber()("2.5").valid).toBe(true);
    expect(positiveNumber()("3,5").valid).toBe(true);
  });

  it("rechaza cero, negativos, vacíos y valores no numéricos", () => {
    expect(positiveNumber()(0).valid).toBe(false);
    expect(positiveNumber()(-1).valid).toBe(false);
    expect(positiveNumber()("0").valid).toBe(false);
    expect(positiveNumber()("").valid).toBe(false);
    expect(positiveNumber()("abc").valid).toBe(false);
    expect(positiveNumber()(Number.NaN).valid).toBe(false);
    expect(positiveNumber()(Number.POSITIVE_INFINITY).valid).toBe(false);
  });

  it("usa el mensaje personalizado", () => {
    expect(positiveNumber("El precio debe ser positivo")(-5).message).toBe(
      "El precio debe ser positivo",
    );
  });
});

describe("email", () => {
  it.each([
    "usuario@dominio.com",
    "nombre.apellido@empresa.com.co",
    "  usuario@dominio.com  ",
  ])("acepta el correo válido %s", (value) => {
    expect(email()(value).valid).toBe(true);
  });

  it.each([
    "",
    "sin-arroba.com",
    "@dominio.com",
    "usuario@",
    "usuario@dominio",
    "usuario @dominio.com",
  ])("rechaza el correo inválido %s", (value) => {
    expect(email()(value).valid).toBe(false);
  });
});

describe("password", () => {
  it("detecta cada requisito de la contraseña", () => {
    expect(getPasswordChecks("Abcdef12")).toEqual({
      minLength: true,
      hasUpper: true,
      hasLower: true,
      hasNumber: true,
    });

    expect(getPasswordChecks("abc")).toEqual({
      minLength: false,
      hasUpper: false,
      hasLower: true,
      hasNumber: false,
    });
  });

  it("calcula la fuerza y determina si es segura", () => {
    expect(getPasswordStrength("")).toBe(0);
    expect(getPasswordStrength("abcdefgh")).toBe(2);
    expect(getPasswordStrength("Abcdef12")).toBe(4);
    expect(isPasswordStrong("Abcdef12")).toBe(true);
    expect(isPasswordStrong("Abcdef1")).toBe(false);
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it("valida la contraseña y rechaza las débiles", () => {
    expect(password()("Abcdef12").valid).toBe(true);
    expect(password()("").message).toBe("La contraseña es obligatoria");
    expect(password()("abcdefgh").valid).toBe(false);
    expect(password()("Abcdefgh").valid).toBe(false);
    expect(password()("Abcdef12!").valid).toBe(true);
  });

  it("respeta una política personalizada", () => {
    const rule = password({ minLength: 12, requireUpper: false, requireNumber: false });
    expect(rule("abcdefghijkl").valid).toBe(true);
    expect(rule("abcdefghijk").valid).toBe(false);

    const message = rule("corta").message;
    expect(message).toContain("12 caracteres");
    expect(message).not.toContain("mayúscula");
  });
});

describe("validateField", () => {
  it("devuelve el primer error de una lista de reglas", () => {
    const result = validateField("", [required(), email()]);
    expect(result).toEqual({ valid: false, message: "Este campo es obligatorio" });
  });

  it("acepta una sola regla", () => {
    expect(validateField("abc", minLength(2))).toEqual({
      valid: true,
      message: "",
    });
  });

  it("devuelve válido sin reglas", () => {
    expect(validateField("cualquier cosa").valid).toBe(true);
  });
});

describe("validateForm", () => {
  const schema = {
    name: [required(), minLength(3)],
    email: [required(), email()],
    age: positiveNumber(),
  };

  it("valida un formulario correcto", () => {
    const result = validateForm(
      { name: "Ana", email: "ana@lubix.com", age: "25" },
      schema,
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.firstError).toBeNull();
  });

  it("acumula errores y expone el primer campo inválido", () => {
    const result = validateForm(
      { name: "", email: "correo-invalido", age: -1 },
      schema,
    );

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("Este campo es obligatorio");
    expect(result.errors.email).toBe("Ingresa un correo electrónico válido");
    expect(result.errors.age).toBe("Debe ser un número mayor que cero");
    expect(result.firstError).toEqual({
      field: "name",
      message: "Este campo es obligatorio",
    });
  });

  it("solo valida los campos incluidos en el esquema", () => {
    const result = validateForm(
      { name: "Ana", email: "ana@lubix.com", age: "25", extra: "" },
      { name: required() },
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});

describe("objeto rules", () => {
  it("expone todas las reglas reutilizables", () => {
    expect(rules.required()("dato").valid).toBe(true);
    expect(rules.minLength(2)("a").valid).toBe(false);
    expect(rules.maxLength(2)("abc").valid).toBe(false);
    expect(rules.lengthBetween(1, 2)("ab").valid).toBe(true);
    expect(rules.positiveNumber()("1").valid).toBe(true);
    expect(rules.password()("Abcdef12").valid).toBe(true);
    expect(rules.email()("a@b.co").valid).toBe(true);
  });
});
