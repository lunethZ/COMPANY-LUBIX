import { test, expect, type Page } from "@playwright/test";

const EMAIL = "ana.tester@lubix.test";
const PASSWORD = "Secreta123";

const successResponse = {
  access_token: "e2e-access-token",
  refresh_token: "e2e-refresh-token",
  id: "user-1",
  Nombre: "Ana Tester",
  email: EMAIL,
  role: "user",
};

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Lubix" })).toBeVisible();
  await expect(page.getByText("Inicia sesión")).toBeVisible();
  await page.getByPlaceholder("tu@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
}

test("login válido: envía las credenciales, guarda la sesión y redirige al home de usuario", async ({
  page,
}) => {
  let sentPayload: { email?: string; password?: string } | null = null;

  await page.route("**/auth/login-user", async (route) => {
    sentPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(successResponse),
    });
  });

  await fillLoginForm(page, EMAIL, PASSWORD);

  await page.waitForURL("**/home-usuario");
  await expect(page).toHaveURL(/\/home-usuario$/);

  expect(sentPayload).toEqual({ email: EMAIL, password: PASSWORD });

  await expect(
    page.getByRole("heading", { name: "Bienvenido de nuevo a Lubix" })
  ).toBeVisible();

  const session = await page.evaluate(() => ({
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
    user: localStorage.getItem("user"),
  }));
  expect(session.access).toBe("e2e-access-token");
  expect(session.refresh).toBe("e2e-refresh-token");
  expect(JSON.parse(session.user ?? "null")).toMatchObject({
    name: "Ana Tester",
    email: EMAIL,
    role_id: "user",
  });
});

test("login con credenciales inválidas: muestra el error y permanece en /login", async ({
  page,
}) => {
  await page.route("**/auth/login-user", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Credenciales incorrectas" }),
    });
  });

  await fillLoginForm(page, "nadie@lubix.test", "malapass");

  const popup = page.locator(".popup-error");
  await expect(popup).toBeVisible();
  await expect(popup).toContainText("Error de Inicio de Sesion");
  await expect(popup).toContainText("Credenciales incorrectas");
  await expect(page).toHaveURL(/\/login$/);
});

test("login con campos vacíos: valida en cliente sin llamar al backend", async ({ page }) => {
  let requests = 0;
  await page.route("**/auth/login-user", async (route) => {
    requests += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  const popup = page.locator(".popup-error");
  await expect(popup).toBeVisible();
  await expect(popup).toContainText("Completa todos los campos");
  expect(requests).toBe(0);
});
