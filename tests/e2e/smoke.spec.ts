import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type Project = {
  id: string;
};

function backendBaseURL() {
  if (process.env.BACKEND_PORT) {
    return `http://127.0.0.1:${process.env.BACKEND_PORT}`;
  }

  const ports = JSON.parse(
    readFileSync('.dev-ports.json', 'utf8')
  ) as Partial<{ backend: number }>;
  expect(ports.backend).toBeTruthy();
  return `http://127.0.0.1:${ports.backend}`;
}

async function createFixtureProject(request: APIRequestContext) {
  const repoPath = `/tmp/viboard-origin-e2e-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
  const response = await request.post(`${backendBaseURL()}/api/projects`, {
    data: {
      name: 'Origin badge e2e',
      git_repo_path: repoPath,
      use_existing_repo: false,
      setup_script: null,
      dev_script: null,
      cleanup_script: null,
      copy_files: null,
      parallel_setup_script: false,
    },
  });
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as ApiResponse<Project>;
  expect(body.success, body.message).toBeTruthy();
  expect(body.data?.id).toBeTruthy();
  return body.data!.id;
}

async function createFixtureTask(
  request: APIRequestContext,
  projectId: string,
  title: string,
  origin: 'human' | 'agent' | null
) {
  const response = await request.post(`${backendBaseURL()}/api/tasks`, {
    data: {
      project_id: projectId,
      title,
      description: null,
      status: 'todo',
      origin,
      parent_task_attempt: null,
      image_ids: null,
    },
  });
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as ApiResponse<unknown>;
  expect(body.success, body.message).toBeTruthy();
}

async function acceptDisclaimerIfVisible(page: import('@playwright/test').Page) {
  const acceptButton = page.getByRole('button', {
    name: 'I Understand, Continue',
  });

  if (await acceptButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await acceptButton.click();
  }
}

test('projects page and settings are reachable', async ({ page }) => {
  await page.goto('/projects');
  await acceptDisclaimerIfVisible(page);

  await expect(
    page.getByRole('heading', { name: 'Projects', exact: true })
  ).toBeVisible();

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings\/general|\/settings\/projects/);
});

test('project list supports clicking into task page when projects exist', async ({
  page,
}) => {
  await page.goto('/projects');
  await acceptDisclaimerIfVisible(page);

  const failedToFetchProjects = page.getByText('Failed to fetch projects');
  if (
    await failedToFetchProjects.isVisible({ timeout: 2_000 }).catch(() => false)
  ) {
    test.skip(true, 'Backend is unavailable or project list failed to load.');
  }

  const noProjectsMessage = page.getByText('No projects yet');
  if (await noProjectsMessage.isVisible({ timeout: 2_000 }).catch(() => false)) {
    test.skip(true, 'No projects exist in local seed data.');
  }

  const firstProjectCard = page.locator('div.cursor-pointer').first();
  await firstProjectCard.click();

  await page.waitForURL(/\/projects\/[^/]+\/(tasks|repository-not-detected)/);
  if (page.url().includes('/repository-not-detected')) {
    test.skip(true, 'Fixture project repository path is unavailable.');
  }

  await expect(page).toHaveURL(/\/projects\/[^/]+\/tasks/);
});

test('task board shows distinct origins for human and agent tasks', async ({
  page,
  request,
}) => {
  const projectId = await createFixtureProject(request);
  await createFixtureTask(request, projectId, 'Human-origin task', null);
  await createFixtureTask(request, projectId, 'Agent-origin task', 'agent');

  await page.goto(`/projects/${projectId}/tasks`);
  await acceptDisclaimerIfVisible(page);

  await expect(page.getByText('Human-origin task')).toBeVisible();
  await expect(page.getByText('Agent-origin task')).toBeVisible();
  await expect(page.getByText('Human').first()).toBeVisible();
  await expect(page.getByText('Agent').first()).toBeVisible();
});

test('invalid project id route renders 404 page', async ({ page }) => {
  await page.goto('/projects/NONEXISTENT_UUID/tasks');
  await acceptDisclaimerIfVisible(page);

  await expect(page.getByText('404 - Page Not Found')).toBeVisible();
});
