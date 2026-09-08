---
name: Mobile Nest first-build boundaries
description: Durable product boundaries for the Bangladesh accessories storefront.
---

The storefront and guest checkout are intentionally public; Clerk is used only for the admin experience, and bKash/Nagad/Rocket selections must never be presented as successful payments until a verified provider flow is connected.

**Why:** The product brief explicitly removes customer registration and asks for a safe payment placeholder rather than simulated success.

**How to apply:** Keep customer browsing, checkout, confirmation, and tracking unauthenticated. Treat online payment orders as pending setup/unpaid until server-side provider confirmation exists.