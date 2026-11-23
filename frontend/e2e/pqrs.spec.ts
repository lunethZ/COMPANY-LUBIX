import { test, expect, type Page } from "@playwright/test";

/**
 * Flujo E2E de PQRS (HU: Peticiones, Quejas, Reclamos y Sugerencias):
 * sesión de usuario -> listado -> nueva solicitud -> envío -> listado actualizado.
 * El backend se simula con `page.route`, así que la prueba no depende de la API real.
 */

const USER = {
  id: "user-1",
  name: "Ana Tester",
  email: "ana.tester@lubix.test",
  role_id: "user",
};

interface PqrsItem {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  user_role: string;
  created_at: string;
}

const existingPqrs: PqrsItem = {
  id: "pqrs-1",
  type: "queja",
  subject: "Problema con mi pedido",
  description: "El pedido llegó incompleto y necesito una solución.",
  status: "pending",
  user_role: "user",
  created_at: "2026-11-01T10:00:00.000Z",
};

async function seedSession(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem("access_token", "e2e-access-token");
    localStorage.setItem("refresh_token", "e2e-refresh-token");
    localStorage.setItem("user", JSON.stringify(user));
  }, USER);
}

/**
 * Simula el backend de PQRS con un listado mutable: cada POST agrega la
 * solicitud y el GET posterior devuelve el listado actualizado.
 */
async function mockPqrsApi(page: Page, remote: PqrsItem[]) {
  await page.route("**/user/dashboard/me", (route) =>
    route.fulfill({
      json: { fullName: USER.name, email: USER.email, tell: "3001234567" },
    }),
  );
  await page.route("**/cart/merge", (route) =>
    route.fulfill({ json: { items: [], subtotal: 0, total_items: 0 } }),
  );
  await page.route("**/cart", (route) =>
    route.fulfill({ json: { items: [], subtotal: 0, total_items: 0 } }),
  );

  const received: Array<Record<string, unknown>> = [];
  await page.route("**/pqrs", async (route) => {
    // La navegación del navegador a /pqrs no debe confundirse con la API.
    if (route.request().resourceType() === "document") {
      return route.continue();
    }
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      received.push(payload);
      const created: PqrsItem = {
        id: `pqrs-${remote.length + 1}`,
        type: payload.type,
        subject: payload.subject,
        description: payload.description,
        status: "pending",
        user_role: "user",
        created_at: "2026-11-20T10:00:00.000Z",
      };
      remote.push(created);
      return route.fulfill({ status: 201, json: created });
    }
    return route.fulfill({ json: remote });
  });

  return received;
}

test("PQRS: crea una petición y la muestra en el listado de solicitudes", async ({
  page,
}) => {
  const remote: PqrsItem[] = [existingPqrs];
  await seedSession(page);
  const received = await mockPqrsApi(page, remote);

  await page.goto("/pqrs");
  await expect(page.getByRole("heading", { name: "PQRS" })).toBeVisible();
  await expect(
    page.getByText("Peticiones, Quejas, Reclamos y Sugerencias"),
  ).toBeVisible();
  await expect(page.getByText("Mis solicitudes (1)")).toBeVisible();
  await expect(page.getByText("Problema con mi pedido")).toBeVisible();
  await expect(page.getByText("Pendiente")).toBeVisible();

  // Abre el formulario y elige el tipo de solicitud.
  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  await expect(
    page.getByRole("heading", { name: "Nueva solicitud PQRS" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Petición" }).click();

  await page
    .getByPlaceholder("Breve descripción del motivo")
    .fill("Solicitud de factura");
  await page
    .getByPlaceholder(
      "Describe tu petición, queja, reclamo o sugerencia en detalle...",
    )
    .fill("Necesito la factura electrónica de mi última compra.");

  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  await expect(
    page.getByText(
      "Tu solicitud ha sido enviada correctamente. El administrador la revisará pronto.",
    ),
  ).toBeVisible();

  expect(received).toEqual([
    {
      type: "peticion",
      subject: "Solicitud de factura",
      description: "Necesito la factura electrónica de mi última compra.",
    },
  ]);

  // El listado se recarga con la nueva solicitud.
  await expect(page.getByText("Mis solicitudes (2)")).toBeVisible();
  await expect(page.getByText("Solicitud de factura")).toBeVisible();
  await expect(page.getByText("Petición", { exact: true })).toBeVisible();
  await expect(page.getByText("Pendiente")).toHaveCount(2);
});

test("PQRS: usuario sin solicitudes ve el estado vacío y puede cerrar el formulario", async ({
  page,
}) => {
  await seedSession(page);
  await mockPqrsApi(page, []);

  await page.goto("/pqrs");
  await expect(page.getByText("Mis solicitudes (0)")).toBeVisible();
  await expect(page.getByText("No tienes solicitudes aún")).toBeVisible();

  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  await expect(
    page.getByRole("heading", { name: "Nueva solicitud PQRS" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(
    page.getByRole("heading", { name: "Nueva solicitud PQRS" }),
  ).toBeHidden();
  await expect(page.getByText("No tienes solicitudes aún")).toBeVisible();
});
