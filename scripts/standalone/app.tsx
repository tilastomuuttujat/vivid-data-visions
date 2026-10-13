import '../../src/styles.css';
import { createRoot } from 'react-dom/client';
import {
  createHashHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider,
} from '@tanstack/react-router';
import { Atlas } from '@/components/atlas/Atlas';
import { Varaan } from '@/components/varaan/Varaan';
import { Observatorio } from '@/components/observatorio/Observatorio';
import { Planeetta } from '@/components/planeetta/Planeetta';
import { AdminBar } from '@/components/editor/AdminBar';

const rootRoute = createRootRoute({ component: () => <><Outlet /><AdminBar /></> });
const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <Atlas /> }),
  createRoute({ getParentRoute: () => rootRoute, path: '/minka-varaan', component: Varaan }),
  createRoute({ getParentRoute: () => rootRoute, path: '/observatorio', component: Observatorio }),
  createRoute({ getParentRoute: () => rootRoute, path: '/planeetta', component: Planeetta }),
];
const router = createRouter({ routeTree: rootRoute.addChildren(routes), history: createHashHistory() });

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
