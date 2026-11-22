import { test, expect, type Page } from "@playwright/test";

/**
 * Flujo E2E de registro (HU-001):
 * formulario de usuario -> validaciones -> envío -> confirmación -> verificación de email.
 * El backend se simula con `page.route`, así que la prueba no depende de la API real.
 */

const NAME = "Ana";
const SURNAME = "Tester";
const EMAIL = "ana.tester@lubix.test";
const TELL = "+57 300 123 4567";
const PASSWORD = "Secreta123";

async function fillRegisterForm(page: Page, confirmPassword = PASSWORD) {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Lubix" })).toBeVisible();
  await expect(page.getByText("Crea tu cuenta gratis")).toBeVisible();

  await page.getByPlaceholder("Su Nombre").fill(NAME);
  await page.getByPlaceholder("Su Apellido").fill(SURNAME);
  await page.getByPlaceholder("tu@email.com").fill(EMAIL);
  await page.getByPlaceholder("+57 300 123 4567").fill(TELL);

  const passwordFields = page.getByPlaceholder("••••••••");
  await passwordFields.first().fill(PASSWORD);
  await passwordFields.nth(1).fill(confirmPassword);
}

test("registro de usuario: envía los datos, confirma y lleva a verificar el correo", async ({
  page,
}) => {
  let sentPayload: Record<string, unknown> | null = null;

  await page.route("**/auth/register-user", async (route) => {
    sentPayload = route.request().postDataJSON();
    await route.fulfill({ json: { message: "Usuario creado" } });
  });

  await fillRegisterForm(page);

  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();

  await expect(page.locator(".popup-success")).toContainText(
    "Usuario registrado correctamente",
  );
  await page.waitForURL("**/register/VerifyEmailPage");

  expect(sentPayload).toEqual({
    fullName: `${NAME} ${SURNAME}`,
    email: EMAIL,
    tell: TELL,
    password: PASSWORD,
  });

  await expect(page.getByText("Verifica email")).toBeVisible();
  await expect(page.getByPlaceholder("tu@email.com")).toBeVisible();
});

test("registro de usuario: rechaza contraseñas que no coinciden sin llamar al backend", async ({
  page,
}) => {
  let registerCalls = 0;
  await page.route("**/auth/register-user", async (route) => {
    registerCalls += 1;
    await route.fulfill({ json: { message: "Usuario creado" } });
  });

  await fillRegisterForm(page, "OtraClave123");

  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();

  await expect(page.locator(".popup-error")).toContainText(
    "Las contraseñas no coinciden",
  );
  expect(registerCalls).toBe(0);
  await expect(page).toHaveURL(/\/register$/);
});

test("registro de usuario: muestra el error del backend en el campo de correo", async ({
  page,
}) => {
  await page.route("**/auth/register-user", (route) =>
    route.fulfill({
      status: 400,
      json: { detail: "El correo ya está registrado" },
    }),
  );

  await fillRegisterForm(page);

  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();

  await expect(page.getByText("El correo ya está registrado")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});
