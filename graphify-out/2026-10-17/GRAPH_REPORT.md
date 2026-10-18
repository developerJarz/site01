# Graph Report - carhat  (2026-10-17)

## Corpus Check
- 377 files · ~410,820 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 52 file(s) not represented in the graph (top: .csv 37, .ttf 9, (none) 3)

## Summary
- 2577 nodes · 6492 edges · 191 communities (113 shown, 78 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `90fa7e7f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- roles/page.tsx
- upload/route.ts
- Charts.tsx
- validate_data.py
- seo-text.ts
- core.py
- [brand]/page.tsx
- site-config.ts
- users/route.ts
- appearance/page.tsx
- design_system.py
- requireAdmin
- db.ts
- cars/page.tsx
- settings/page.tsx
- PageHero
- search_stack
- Data Loading Principles and Patterns
- cn
- normalisePhoneNumber
- listings/page.tsx
- connectToDatabase
- [filename]/route.ts
- buildMetadata
- DesignSystemGenerator
- test_design_system_mode.py
- dependencies
- Button
- Medusa Admin Dashboard Customizations
- package.json
- seo.ts
- utils.ts
- BM25
- _style_is_dark_primary
- profile/page.tsx
- next
- Navigation and Routing
- compilerOptions
- Default Open Graph Share Card (og-default.jpg)
- favorites/route.ts
- watermark.ts
- admin/page.tsx
- test_skill_script_paths.py
- components.json
- lucide-react
- Part B Semantic Extraction (Subagents)
- detect_domain
- Displaying Entities - Patterns and Components
- CatalogRefreshTest
- graphify Full Pipeline
- users/page.tsx
- operations.ts
- graph.json
- --update Incremental Re-extraction
- devDependencies
- about/page.tsx
- app/layout.tsx
- scripts
- UI/UX Pro Max - Design Intelligence
- graphify SKILL.md
- graphify query reference
- migrate-images-to-cloudinary.mjs
- test_catalog_summary_line_endings.py
- CONTAINER
- 5. Re-render Optimization
- TestTextLayoutDataContracts
- create-next-app Boilerplate Assets
- TestStackFlagWithDesignSystem
- Content Strategy
- graphify transcribe reference
- 7. JavaScript Performance
- eslint.config.mjs
- postcss.config.mjs
- Quick Reference
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- Typography Guidelines
- Content Distribution Spine
- Headless CMS Guide
- 6. Rendering Performance
- 3. Server-Side Performance
- ProfilePhotoUpload.tsx
- Forms and Modal Patterns
- React Best Practices
- Sections
- Homepage Vehicle Category Tiles (body-type browse grid)
- Footer.tsx
- Table Selection Pattern
- AiAssistant.tsx
- Complete Examples
- Key Implementation Details
- Content Ideation Sources
- Frontend Design
- 1. Eliminating Waterfalls
- 2. Bundle Size Optimization
- Key Form Patterns
- Prioritizing Content Ideas
- React Best Practices
- Platform Comparison
- Integration with Marketing Skills
- Before Planning
- Keyword Research by Buyer Stage
- 8. Advanced Patterns
- dashboard/page.tsx
- Content Modeling for Marketing
- Output Format
- Content Types
- async-cheap-condition-before-await.md
- Prefer Statically Analyzable Paths
- server-hoist-static-io.md
- site01
- AGENTS.md
- advanced-effect-event-deps.md
- advanced-event-handler-refs.md
- advanced-init-once.md
- advanced-use-latest.md
- async-api-routes.md
- async-dependencies.md
- async-parallel.md
- async-suspense-boundaries.md
- bundle-barrel-imports.md
- bundle-conditional.md
- bundle-defer-third-party.md
- bundle-dynamic-imports.md
- bundle-preload.md
- client-event-listeners.md
- client-localstorage-schema.md
- client-passive-event-listeners.md
- client-swr-dedup.md
- js-batch-dom-css.md
- js-cache-function-results.md
- js-cache-property-access.md
- js-cache-storage.md
- js-combine-iterations.md
- js-early-exit.md
- js-flatmap-filter.md
- js-hoist-regexp.md
- js-index-maps.md
- js-length-check-first.md
- js-min-max-loop.md
- js-request-idle-callback.md
- js-set-map-lookups.md
- js-tosorted-immutable.md
- rendering-activity.md
- rendering-animate-svg-wrapper.md
- rendering-conditional-render.md
- rendering-content-visibility.md
- rendering-hoist-jsx.md
- rendering-hydration-no-flicker.md
- rendering-hydration-suppress-warning.md
- rendering-resource-hints.md
- rendering-script-defer-async.md
- rendering-svg-precision.md
- rendering-usetransition-loading.md
- rerender-defer-reads.md
- rerender-dependencies.md
- rerender-derived-state.md
- rerender-derived-state-no-effect.md
- rerender-functional-setstate.md
- rerender-lazy-state-init.md
- rerender-memo.md
- rerender-memo-with-default-value.md
- rerender-move-effect-to-event.md
- rerender-simple-expression-in-memo.md
- rerender-split-combined-hooks.md
- rerender-transitions.md
- rerender-use-deferred-value.md
- rerender-use-ref-transient-values.md
- server-after-nonblocking.md
- server-auth-actions.md
- server-cache-lru.md
- server-dedup-props.md
- server-parallel-fetching.md
- server-parallel-nested-fetching.md
- server-serialization.md
- _template.md
- CLAUDE.md
- Sell Banner Photo (black Range Rover Sport in front of garage)
- ui.tsx
- TrafficDashboard.tsx
- image-processing.ts
- api/newsletter/route.ts
- seo-score.ts
- AdminShell.tsx
- dealers/page.tsx
- check-cloudinary.mjs
- next-auth
- FONTS.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 190 edges
2. `connectToDatabase()` - 141 edges
3. `next` - 128 edges
4. `lucide-react` - 76 edges
5. `Button()` - 68 edges
6. `react` - 67 edges
7. `requireAdmin()` - 54 edges
8. `formatLakh()` - 48 edges
9. `Button()` - 44 edges
10. `search()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `5.4 Don't Define Components Inside Components` --references--> `Avatar()`  [INFERRED]
  .agents/skills/vercel-react-best-practices/AGENTS.md → src/app/admin/users/page.tsx
- `Don't Define Components Inside Components` --references--> `Avatar()`  [INFERRED]
  .agents/skills/vercel-react-best-practices/rules/rerender-no-inline-components.md → src/app/admin/users/page.tsx
- `SEO Fields Checklist` --references--> `slug()`  [INFERRED]
  .agents/skills/content-strategy/references/headless-cms.md → src/app/faq/page.tsx
- `3. Navigate to Your Custom UI` --references--> `label()`  [INFERRED]
  .agents/skills/building-admin-dashboard-customizations/SKILL.md → src/app/cars/[slug]/page.tsx
- `Widget vs UI Route` --references--> `label()`  [INFERRED]
  .agents/skills/building-admin-dashboard-customizations/SKILL.md → src/app/cars/[slug]/page.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **graphify Export Formats** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_export, _claude_skills_graphify_references_exports_graphml_export, _claude_skills_graphify_references_exports_mcp_server, _claude_skills_graphify_skill_html_obsidian_export [EXTRACTED 1.00]
- **Query Feedback and Work Memory Loop** — _claude_skills_graphify_references_query_query_expansion, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_work_memory_lessons, _claude_skills_graphify_references_update_incremental_update [EXTRACTED 1.00]
- **Homepage Popular Brands Logo Set** — src_components_home_data, public_brands_toyota_logo, public_brands_honda_logo, public_brands_bmw_logo, public_brands_mercedes_logo, public_brands_nissan_logo, public_brands_audi_logo, public_brands_hyundai_logo, public_brands_mitsubishi_logo [EXTRACTED 1.00]
- **Default Open Graph Image Pipeline** — public_og_default_image, src_lib_seo, src_app_admin_seo_page, src_app_api_admin_seo_route [EXTRACTED 1.00]
- **Homepage Vehicle Category Tile Images** — public_images_home_cat_suv_image, public_images_home_cat_sedan_image, public_images_home_cat_hatchback_image, public_images_home_cat_mpv_image, public_images_home_cat_pickup_image, public_images_home_cat_luxury_image, public_images_home_cat_hybrid_image, public_images_home_cat_electric_image, src_components_home_data [EXTRACTED 1.00]
- **Logo Fallback via SiteSettings logoUrl default** — public_car_hat_bd_image, src_lib_models_sitesettings, src_context_sitesettingscontext, src_components_layout_navbar, src_components_layout_footer, src_components_admin_adminshell, src_components_layout_maintenancegate [EXTRACTED 1.00]
- **Graph Auto-Rebuild Triggers** — _claude_skills_graphify_references_add_watch_watch_mode, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update, _claude_skills_graphify_references_update_code_only_path [INFERRED 0.85]
- **Unused Next.js Starter Icons** — public_file_icon, public_globe_icon, public_next_logo, public_vercel_logo, public_window_icon [INFERRED 0.85]

## Communities (191 total, 78 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.09
Nodes (47): framer-motion, BANDS, BODY_TABS, BUDGET_BUCKETS, CARD_FIELDS, CarDoc, Home(), OPEN_BOTTOM (+39 more)

### Community 1 - "roles/page.tsx"
Cohesion: 0.16
Nodes (15): Draft, FragmentRows(), PermissionInfo, Role, ROLE_TINT, RolesPage(), RolesResponse, ImageField() (+7 more)

### Community 2 - "upload/route.ts"
Cohesion: 0.15
Nodes (25): dynamic, listingWatermark(), POST(), runtime, saveDocumentLocally(), SITE_IMAGE_PERMISSIONS, DELETE(), dynamic (+17 more)

### Community 3 - "Charts.tsx"
Cohesion: 0.14
Nodes (28): recharts, BarList(), CategoryTick(), ColumnChart(), DonutChart(), GroupedBars(), LineChart(), longDate() (+20 more)

### Community 4 - "validate_data.py"
Cohesion: 0.07
Nodes (49): Semantic quality contracts for the core UI/UX datasets., read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract() (+41 more)

### Community 5 - "seo-text.ts"
Cohesion: 0.05
Nodes (53): ref_node_assert, ref_node_test, POST(), POST(), dynamic, GET(), SellerDoc, SORTS (+45 more)

### Community 6 - "core.py"
Cohesion: 0.04
Nodes (54): _contains_phrase(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _file_signature(), _get_bm25(), _legacy_successor_guidance(), _load_csv() (+46 more)

### Community 7 - "[brand]/page.tsx"
Cohesion: 0.17
Nodes (21): editablePages(), brandFaq(), BrandPage(), CARD_FIELDS, generateMetadata(), loadBrand(), Props, revalidate (+13 more)

### Community 8 - "site-config.ts"
Cohesion: 0.06
Nodes (58): appearanceUpdate(), dynamic, GET(), PATCH(), settingsUpdate(), text(), GET(), identity() (+50 more)

### Community 9 - "users/route.ts"
Cohesion: 0.12
Nodes (34): DELETE(), dynamic, GET(), isBuiltIn(), PATCH(), POST(), text(), DELETE() (+26 more)

### Community 10 - "appearance/page.tsx"
Cohesion: 0.20
Nodes (21): AppearancePage(), Brand, BRAND_COLORS, BrandTab(), FaqEditor(), FaviconCheck(), FooterTab(), Form (+13 more)

### Community 11 - "design_system.py"
Cohesion: 0.06
Nodes (51): _detect_page_type(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides(), persist_design_system(), Persist design system to design-system/<project>/ folder using Master +…, Format a page-specific override file with intelligent AI-generated content., Generate intelligent overrides based on page type using layered search. Uses… (+43 more)

### Community 12 - "requireAdmin"
Cohesion: 0.08
Nodes (31): DELETE(), dynamic, GET(), PATCH(), POST(), dynamic, GET(), DELETE() (+23 more)

### Community 13 - "db.ts"
Cohesion: 0.08
Nodes (43): mongoose, dynamic, dailySeries(), dynamic, GET(), perDay(), withThumb(), dynamic (+35 more)

### Community 14 - "cars/page.tsx"
Cohesion: 0.07
Nodes (44): Car Brand Logos, Audi logo (four interlocking rings, monochrome), BMW logo (blue roundel with quartered circle), Honda logo (red HONDA wordmark), Hyundai logo (navy italic HYUNDAI wordmark), Kia logo (dark KIA wordmark), Lexus logo (spaced LEXUS wordmark), Mazda logo (MAZDA wordmark) (+36 more)

### Community 15 - "settings/page.tsx"
Cohesion: 0.14
Nodes (20): AdminSettingsPage(), Form, IconInput(), pickForm(), SOCIAL, Tab, SaveBar(), ColorField() (+12 more)

### Community 16 - "PageHero"
Cohesion: 0.20
Nodes (19): AboutPage(), BrandsPage(), ContactForm(), CONTACT_FAQ, ContactPage(), HELP, revalidate, FAQPage() (+11 more)

### Community 17 - "search_stack"
Cohesion: 0.09
Nodes (9): _exact_stack_identifier(), Resolve a standalone API identifier even when its BM25 IDF is low., Search stack-specific guidelines, search_stack(), TestDiagnosticsContracts, _rows(), TestNativeDesktopStackFreshness, _rows() (+1 more)

### Community 18 - "Data Loading Principles and Patterns"
Cohesion: 0.05
Nodes (36): Authentication/Authorization errors when fetching data, Basic Mutation, Basic Query, Cache Invalidation Guidelines, Common Issues & Solutions, Common Mistake vs Correct Pattern, Common Patterns, Complete Example: Widget with Separate Queries (+28 more)

### Community 19 - "cn"
Cohesion: 0.15
Nodes (23): @radix-ui/react-tabs, BlogArchivePage(), generateMetadata(), revalidate, TagLink(), BlogPostPage(), dynamic, revalidate (+15 more)

### Community 20 - "normalisePhoneNumber"
Cohesion: 0.11
Nodes (29): ref_crypto, nodemailer, POST(), POST(), ContactDetails, ContactInput, dialableNumber(), normalisePhoneNumber() (+21 more)

### Community 21 - "listings/page.tsx"
Cohesion: 0.21
Nodes (15): AdminListingsPage(), BulkButton(), dataUrlToBlob(), Listing, ListingsManager(), ListResponse, PAPER_FILTERS, PapersCell() (+7 more)

### Community 22 - "connectToDatabase"
Cohesion: 0.08
Nodes (40): BULK_FIELDS, DELETE(), dynamic, EDITABLE_FIELDS, GET(), PAPER_FIELDS, PATCH(), SORTS (+32 more)

### Community 23 - "[filename]/route.ts"
Cohesion: 0.22
Nodes (7): Uploaded Image 1782323677351 (GWR train at station platform; not a car), Uploaded Image 1782323677829 (US one-dollar bill on wood; not a car), Local Uploads Directory Media (served via /uploads/[filename]), ref_fs, ref_path, dynamic, MIME_TYPES

### Community 24 - "buildMetadata"
Cohesion: 0.12
Nodes (12): generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata() (+4 more)

### Community 25 - "DesignSystemGenerator"
Cohesion: 0.06
Nodes (18): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Find matching reasoning rule for a category., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are… (+10 more)

### Community 26 - "test_design_system_mode.py"
Cohesion: 0.05
Nodes (38): ansi_ljust(), _button_outline_text_color(), _contrast_ratio(), _derive_dark_palette(), _filter_anti_patterns_for_mode(), format_ascii_box(), add_wrapped(), wrap_text() (+30 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, axios, bcryptjs, class-variance-authority, cloudinary, clsx, framer-motion, @hookform/resolvers (+17 more)

### Community 28 - "Button"
Cohesion: 0.14
Nodes (28): AdminSeoPage(), Audit, CheckList(), Defaults, DefaultsEditor(), EMPTY, EMPTY_REVIEW, Globals (+20 more)

### Community 29 - "Medusa Admin Dashboard Customizations"
Cohesion: 0.07
Nodes (28): 1. Data Loading (CRITICAL), 1. Start the Development Server, 2. Access the Admin Dashboard, 2. Design System (CRITICAL), 3. Data Display (HIGH), 3. Navigate to Your Custom UI, 4. Test Functionality, 4. Typography (HIGH) (+20 more)

### Community 30 - "package.json"
Cohesion: 0.09
Nodes (22): name, private, version, axios, clsx, @hookform/resolvers, @radix-ui/react-dialog, @radix-ui/react-slot (+14 more)

### Community 31 - "seo.ts"
Cohesion: 0.11
Nodes (25): contentAudit(), dynamic, GET(), isImageUrl(), LIMITS, PAGE_FIELDS, PATCH(), PUT() (+17 more)

### Community 32 - "utils.ts"
Cohesion: 0.13
Nodes (38): EditListing(), CARD_FIELDS, CarDetailsPage(), dynamic, CarGallery(), optimisable(), CarCard(), CONDITION_LABEL (+30 more)

### Community 33 - "BM25"
Cohesion: 0.13
Nodes (8): BM25, BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes., TestBm25CoreBehavior, TestTokenizer

### Community 34 - "_style_is_dark_primary"
Cohesion: 0.21
Nodes (7): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution

### Community 35 - "profile/page.tsx"
Cohesion: 0.17
Nodes (17): ChatMessage, Conversation, MessagesContent(), MessagesPage(), QUICK_REPLIES_BUYER, QUICK_REPLIES_SELLER, Loading(), Card() (+9 more)

### Community 36 - "next"
Cohesion: 0.12
Nodes (11): nextConfig, next, POST(), POST(), dynamic, GET(), metadata, metadata (+3 more)

### Community 37 - "Navigation and Routing"
Cohesion: 0.08
Nodes (24): Accessing Route Parameters, Basic Navigation with Link Component, Button-styled Link, Common Built-in Routes, Common Navigation Patterns, Contents, Important Notes, Link with Dynamic ID (+16 more)

### Community 38 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 39 - "Default Open Graph Share Card (og-default.jpg)"
Cohesion: 0.40
Nodes (5): CarHat Brand Identity (teal-to-blue gradient wordmark with SUV in C and top-down car as H), CarHat BD Logo (car-hat-bd.png), Hero Photo (white BMW M5 in motion), Default Open Graph Share Card (og-default.jpg), Social Share Card Messaging (Buy & sell cars in Bangladesh, Paper Verified, Post your car free)

### Community 40 - "favorites/route.ts"
Cohesion: 0.38
Nodes (8): currentUserId(), DELETE(), dynamic, failure(), GET(), POST(), FavoriteRequestError, parseFavoriteMutation()

### Community 41 - "watermark.ts"
Cohesion: 0.12
Nodes (20): ref_node_module, cloudinaryWatermark(), escapeMarkup(), FONT_DIR, GRAVITY, growShape(), lineShadow(), renderLine() (+12 more)

### Community 42 - "admin/page.tsx"
Cohesion: 0.13
Nodes (23): ActionCard(), AdminDashboard(), CONDITION_LABEL, CustomizeDashboard(), DashboardData, Kpi(), PRICE_PARAMS, RANGES (+15 more)

### Community 43 - "test_skill_script_paths.py"
Cohesion: 0.38
Nodes (5): Every script invocation in the shipped skill markdown resolves from the skill…, Return (target, None) for a skill-relative path, or (None, reason)., resolve(), shipped_invocations(), SkillScriptPathsTest

### Community 44 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 45 - "lucide-react"
Cohesion: 0.10
Nodes (37): class-variance-authority, lucide-react, react, Blog, emptyForm, Contact(), Error(), ForgotPasswordPage() (+29 more)

### Community 46 - "Part B Semantic Extraction (Subagents)"
Cohesion: 0.16
Nodes (15): graphify extraction-spec reference, Discrete Confidence Score Rubric, Hyperedges, Node ID Format (full-path stem), semantically_similar_to Edges, Extraction Subagent Prompt, Chunk Splitting (20-25 files), EXTRACTED/INFERRED/AMBIGUOUS Audit Trail (+7 more)

### Community 47 - "detect_domain"
Cohesion: 0.23
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 48 - "Displaying Entities - Patterns and Components"
Cohesion: 0.09
Nodes (22): Card with elevation and hover, Common Class Patterns, Compact List (No Cards), Complete DataTable Implementation, Conditional Rendering Based on Count, Contents, DataTable Pattern, DataTable Troubleshooting (+14 more)

### Community 50 - "graphify Full Pipeline"
Cohesion: 0.18
Nodes (14): graphify exports reference, FalkorDB Export, GraphML Export, MCP Stdio Server (graphify.serve), Neo4j Export, SVG Export, Token Reduction Benchmark, Corpus Size Warning (>2M words / >500 files) (+6 more)

### Community 51 - "users/page.tsx"
Cohesion: 0.18
Nodes (19): Don't Define Components Inside Components, AddUserModal(), AdminContactNumbers(), AdminUser, AdminUsersPage(), Avatar(), CUSTOMER_ROLES, Detail (+11 more)

### Community 52 - "operations.ts"
Cohesion: 0.28
Nodes (13): cloudinary, ref_server_only, checkCloudinaryConnection(), CloudinaryHealthResult, src_lib_cloudinary_client_cloudinary, getCloudinaryClient(), clearConfigCache(), CloudinaryConfigOptions (+5 more)

### Community 53 - "graph.json"
Cohesion: 0.23
Nodes (12): Wiki Export, source_file Verbatim Rule, Inline NetworkX Fallback, build_merge Replace-on-Re-extract, --cluster-only, Step 4 Build, Cluster, Analyze, Step 5 Community Labeling, Directed Graph Mode (--directed) (+4 more)

### Community 54 - "--update Incremental Re-extraction"
Cohesion: 0.33
Nodes (11): graphify add/watch reference, graphify add (URL ingest), needs_update Flag, --watch Folder Watcher, Post-Commit Auto-Rebuild Hook, graphify update reference, Code-Only Update Path, Graph Diff (+3 more)

### Community 55 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs, @types/node, @types/nodemailer (+3 more)

### Community 56 - "about/page.tsx"
Cohesion: 0.18
Nodes (10): AUDIENCES, CITIES, FEATURE_ICONS, generateMetadata(), revalidate, STAT_ICONS, FEATURES, PAPERS (+2 more)

### Community 57 - "app/layout.tsx"
Cohesion: 0.23
Nodes (11): src_app_globals, jakarta, RootLayout(), viewport, sitemap(), AnnouncementBar(), ALWAYS_OPEN, MaintenanceGate() (+3 more)

### Community 58 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, check:cloudinary, dev, lint, migrate:images, netlify:build, prepublishOnly (+2 more)

### Community 59 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (17): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+9 more)

### Community 60 - "graphify SKILL.md"
Cohesion: 0.31
Nodes (9): .claude/CLAUDE.md (graphify trigger), graphify GitHub and merge reference, graphify clone, graphify merge-graphs (Cross-Repo Graph), Monorepo Per-Subfolder Extract, graphify hooks reference, Native CLAUDE.md Integration (graphify claude install), graphify SKILL.md (+1 more)

### Community 61 - "graphify query reference"
Cohesion: 0.36
Nodes (9): graphify query reference, BFS Traversal, DFS Traversal, /graphify explain, /graphify path, Constrained Query Expansion, save-result Feedback Loop, Token Budget (--budget) (+1 more)

### Community 62 - "migrate-images-to-cloudinary.mjs"
Cohesion: 0.23
Nodes (14): ref_node_crypto, APPLY, compress(), configureCloudinary(), kind(), main(), migrateArray(), migrateField() (+6 more)

### Community 63 - "test_catalog_summary_line_endings.py"
Cohesion: 0.08
Nodes (11): CatalogSummaryLineEndingsTest, _load_generator(), The catalog snapshot must not depend on the checkout's line endings. Regression…, Simulate a Windows checkout: the recorded hashes must still validate., Unit tests for metric math and relevance fixture validation., TestFixtureValidation, TestMetricMath, TestThresholdGate (+3 more)

### Community 64 - "CONTAINER"
Cohesion: 0.23
Nodes (9): generateMetadata(), PrivacyPage(), revalidate, generateMetadata(), revalidate, TermsPage(), LegalPage(), LegalSection (+1 more)

### Community 65 - "5. Re-render Optimization"
Cohesion: 0.12
Nodes (16): 5.10 Subscribe to Derived State, 5.11 Use Functional setState Updates, 5.12 Use Lazy State Initialization, 5.13 Use Transitions for Non-Urgent Updates, 5.14 Use useDeferredValue for Expensive Derived Renders, 5.15 Use useRef for Transient Values, 5.1 Calculate Derived State During Rendering, 5.2 Defer State Reads to Usage Point (+8 more)

### Community 67 - "create-next-app Boilerplate Assets"
Cohesion: 0.33
Nodes (6): create-next-app Boilerplate Assets, File icon (document with folded corner), Globe icon, Next.js wordmark logo, Vercel logo (triangle), Browser window icon

### Community 69 - "Content Strategy"
Cohesion: 0.13
Nodes (15): Calendar Split: 60/30/10, Content Pillars and Topic Clusters, Content Strategy, Create Once, Distribute Twice, How to Identify Pillars, Per-Format Execution Discipline, Pillar Criteria, Pillar Structure (+7 more)

### Community 70 - "graphify transcribe reference"
Cohesion: 0.67
Nodes (4): graphify transcribe reference, Domain Hint Whisper Prompt, Whisper Transcription (transcribe_all), God Nodes

### Community 71 - "7. JavaScript Performance"
Cohesion: 0.13
Nodes (15): 7.10 Hoist RegExp Creation, 7.11 Use flatMap to Map and Filter in One Pass, 7.12 Use Loop for Min/Max Instead of Sort, 7.13 Use Set/Map for O(1) Lookups, 7.14 Use toSorted() Instead of sort() for Immutability, 7.1 Avoid Layout Thrashing, 7.2 Build Index Maps for Repeated Lookups, 7.3 Cache Property Access in Loops (+7 more)

### Community 72 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 74 - "Quick Reference"
Cohesion: 0.13
Nodes (14): 1. Eliminating Waterfalls (CRITICAL), 2. Bundle Size Optimization (CRITICAL), 3. Server-Side Performance (HIGH), 4. Client-Side Data Fetching (MEDIUM-HIGH), 5. Re-render Optimization (MEDIUM), 6. Rendering Performance (MEDIUM), 7. JavaScript Performance (LOW-MEDIUM), 8. Advanced Patterns (LOW) (+6 more)

### Community 75 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 76 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 77 - "Typography Guidelines"
Cohesion: 0.17
Nodes (12): Body/Descriptions, Card with Title and Metadata, Common Patterns, Contents, Core Typography Pattern, Headings/Labels, Inline Label-Value Pair, Quick Reference (+4 more)

### Community 78 - "Content Distribution Spine"
Cohesion: 0.17
Nodes (9): Atomization Checklist (per flagship), Content Distribution Spine, Create Once, Distribute Twice, Failure Modes, Platform Half-Lives, Related, The Content Distribution Flywheel, The ORB Framework as a Funnel (+1 more)

### Community 79 - "Headless CMS Guide"
Cohesion: 0.17
Nodes (12): Decision Checklist, Draft → Review → Publish Cycle, Editorial Workflows, Headless CMS Guide, Headless vs Traditional CMS, Implementation Checklist, Preview APIs, Relevant Integration Guides (+4 more)

### Community 80 - "6. Rendering Performance"
Cohesion: 0.17
Nodes (12): 6.10 Use React DOM Resource Hints, 6.11 Use useTransition Over Manual Loading States, 6.1 Animate SVG Wrapper Instead of SVG Element, 6.2 CSS content-visibility for Long Lists, 6.3 Hoist Static JSX Elements, 6.4 Optimize SVG Precision, 6.5 Prevent Hydration Mismatch Without Flickering, 6.6 Suppress Expected Hydration Mismatches (+4 more)

### Community 81 - "3. Server-Side Performance"
Cohesion: 0.18
Nodes (10): 3.10 Use after() for Non-Blocking Operations, 3.1 Authenticate Server Actions Like API Routes, 3.2 Avoid Duplicate Serialization in RSC Props, 3.3 Avoid Shared Module State for Request Data, 3.4 Cross-Request LRU Caching, 3.5 Hoist Static I/O to Module Level, 3.6 Minimize Serialization at RSC Boundaries, 3.7 Parallel Data Fetching with Component Composition (+2 more)

### Community 82 - "ProfilePhotoUpload.tsx"
Cohesion: 0.35
Nodes (8): ProfilePhotoUpload(), choose(), save(), compressImageFile(), IMAGE_ACCEPT, IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, validateImageFile()

### Community 83 - "Forms and Modal Patterns"
Cohesion: 0.20
Nodes (10): Contents, Drawer Example, Dropdown Menu with Actions, Edit Button Patterns, FocusModal Example, FocusModal vs Drawer, Form with Validation and Loading States, Forms and Modal Patterns (+2 more)

### Community 84 - "React Best Practices"
Cohesion: 0.20
Nodes (9): 4.1 Deduplicate Global Event Listeners, 4.2 Use Passive Event Listeners for Scrolling Performance, 4.3 Use SWR for Automatic Deduplication, 4.4 Version and Minimize localStorage Data, 4. Client-Side Data Fetching, Abstract, React Best Practices, References (+1 more)

### Community 85 - "Sections"
Cohesion: 0.20
Nodes (9): 1. Eliminating Waterfalls (async), 2. Bundle Size Optimization (bundle), 3. Server-Side Performance (server), 4. Client-Side Data Fetching (client), 5. Re-render Optimization (rerender), 6. Rendering Performance (rendering), 7. JavaScript Performance (js), 8. Advanced Patterns (advanced) (+1 more)

### Community 86 - "Homepage Vehicle Category Tiles (body-type browse grid)"
Cohesion: 0.20
Nodes (10): App Promo Car Photo (silver Toyota RAV4, portrait), Electric Category Tile (white Tesla Model Y), Hatchback Category Tile (blue VW Polo), Hybrid Category Tile (grey Toyota Camry), Luxury Category Tile (white Mercedes GLE Coupe), MPV Category Tile (white Ford Expedition), Pickup Category Tile (tan Toyota Tacoma), Sedan Category Tile (white Toyota Corolla) (+2 more)

### Community 87 - "Footer.tsx"
Cohesion: 0.47
Nodes (8): Footer(), NewsletterForm(), SiteFooter(), FacebookIcon(), InstagramIcon(), LinkedinIcon(), TwitterIcon(), YoutubeIcon()

### Community 88 - "Table Selection Pattern"
Cohesion: 0.22
Nodes (9): Complete Widget Example: Related Products Selection, Contents, For Categories Selection, For Custom Endpoints, For Regions Selection, Important Notes, Pattern Variations, Pre-Implementation Requirements for pnpm (+1 more)

### Community 89 - "AiAssistant.tsx"
Cohesion: 0.16
Nodes (16): AiAssistant(), Match, Reply, SUGGESTIONS, AI_DEFAULT, amount(), CarIntent, CATEGORY_WORDS (+8 more)

### Community 90 - "Complete Examples"
Cohesion: 0.25
Nodes (8): Badge or Status Text, Complete Examples, Container Header (Use Heading), Empty State Message, Error Message, Form Field Label, List Item with Title and Subtitle, Widget Section with Label and Description

### Community 91 - "Key Implementation Details"
Cohesion: 0.29
Nodes (7): 1. Typography, 2. State Management, 3. Data Loading Pattern - CRITICAL, 4. Updating with useMutation and Cache Invalidation, 5. DataTable Configuration, 6. Component Structure, Key Implementation Details

### Community 92 - "Content Ideation Sources"
Cohesion: 0.29
Nodes (7): 1. Keyword Data, 2. Call Transcripts, 3. Survey Responses, 4. Forum Research, 5. Competitor Analysis, 6. Sales and Support Input, Content Ideation Sources

### Community 93 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 94 - "1. Eliminating Waterfalls"
Cohesion: 0.29
Nodes (7): 1.1 Check Cheap Conditions Before Async Flags, 1.2 Defer Await Until Needed, 1.3 Dependency-Based Parallelization, 1.4 Prevent Waterfall Chains in API Routes, 1.5 Promise.all() for Independent Operations, 1.6 Strategic Suspense Boundaries, 1. Eliminating Waterfalls

### Community 95 - "2. Bundle Size Optimization"
Cohesion: 0.29
Nodes (7): 2.1 Avoid Barrel File Imports, 2.2 Conditional Module Loading, 2.3 Defer Non-Critical Third-Party Libraries, 2.4 Dynamic Imports for Heavy Components, 2.5 Prefer Statically Analyzable Paths, 2.6 Preload Based on User Intent, 2. Bundle Size Optimization

### Community 96 - "Key Form Patterns"
Cohesion: 0.33
Nodes (6): Always Disable Actions During Mutations, Clear Field Errors on Input Change, Clear Form After Success, Key Form Patterns, Show Loading State on Submit Button, Validate Before Submitting

### Community 97 - "Prioritizing Content Ideas"
Cohesion: 0.33
Nodes (6): 1. Customer Impact (40%), 2. Content-Market Fit (30%), 3. Search Potential (20%), 4. Resource Requirements (10%), Prioritizing Content Ideas, Scoring Template

### Community 98 - "React Best Practices"
Cohesion: 0.33
Nodes (5): Creating a New Rule, Getting Started, React Best Practices, Rule File Structure, Structure

### Community 99 - "Platform Comparison"
Cohesion: 0.40
Nodes (5): Contentful, Others Worth Knowing, Platform Comparison, Sanity, Strapi

### Community 100 - "Integration with Marketing Skills"
Cohesion: 0.40
Nodes (5): Copywriting, Email Sequences, Integration with Marketing Skills, Programmatic SEO, Site Architecture

### Community 101 - "Before Planning"
Cohesion: 0.40
Nodes (5): 1. Business Context, 2. Customer Research, 3. Current State, 4. Competitive Landscape, Before Planning

### Community 102 - "Keyword Research by Buyer Stage"
Cohesion: 0.40
Nodes (5): Awareness Stage, Consideration Stage, Decision Stage, Implementation Stage, Keyword Research by Buyer Stage

### Community 103 - "8. Advanced Patterns"
Cohesion: 0.40
Nodes (5): 8.1 Do Not Put Effect Events in Dependency Arrays, 8.2 Initialize App Once, Not Per Mount, 8.3 Store Event Handlers in Refs, 8.4 useEffectEvent for Stable Callback Refs, 8. Advanced Patterns

### Community 104 - "dashboard/page.tsx"
Cohesion: 0.09
Nodes (45): DashboardPage(), DashboardSummary, MyListing, PriceDialog(), Shortcut(), Stat(), STATUS, Tab (+37 more)

### Community 105 - "Content Modeling for Marketing"
Cohesion: 0.50
Nodes (4): Common Marketing Content Types, Content Modeling for Marketing, Core Principles, SEO Fields Checklist

### Community 106 - "Output Format"
Cohesion: 0.50
Nodes (4): 1. Content Pillars, 2. Priority Topics, 3. Topic Cluster Map, Output Format

### Community 107 - "Content Types"
Cohesion: 0.50
Nodes (4): Content Types, Link-Earning Formats, Searchable Content Types, Shareable Content Types

### Community 109 - "Prefer Statically Analyzable Paths"
Cohesion: 0.50
Nodes (3): File-System Paths, Import Paths, Prefer Statically Analyzable Paths

### Community 181 - "ui.tsx"
Cohesion: 0.14
Nodes (25): AdminInboxPage(), InboxManager(), InboxResponse, Message, TABS, AdminNewsletterPage(), Response, Subscriber (+17 more)

### Community 182 - "TrafficDashboard.tsx"
Cohesion: 0.14
Nodes (24): ctr(), Delta(), getReport(), ListingRow, ListingTraffic(), Metric, Points, RANGES (+16 more)

### Community 183 - "image-processing.ts"
Cohesion: 0.16
Nodes (15): ref_node_fs, ref_node_path, sharp, dynamic, POST(), runtime, SAMPLES, IMAGE_TARGETS (+7 more)

### Community 184 - "api/newsletter/route.ts"
Cohesion: 0.27
Nodes (7): dynamic, POST(), INewsletterSubscriber, NewsletterSubscriber, NewsletterSubscriberSchema, NewsletterRequestError, parseNewsletterSignup()

### Community 185 - "seo-score.ts"
Cohesion: 0.27
Nodes (8): between(), CheckStatus, mentions(), ScoreInput, scorePage(), SeoCheck, VALUE, good

### Community 186 - "AdminShell.tsx"
Cohesion: 0.18
Nodes (16): AdminLayout(), metadata, AdminProvider(), AdminShell(), AlertsMenu(), ALL_ITEMS, CommandPalette(), Counts (+8 more)

### Community 187 - "dealers/page.tsx"
Cohesion: 0.33
Nodes (6): BENEFITS, Dealer, DealersPage(), generateMetadata(), getDealers(), revalidate

### Community 189 - "next-auth"
Cohesion: 0.09
Nodes (24): bcryptjs, next-auth, POST(), dynamic, GET(), SOURCE, Totals, handler (+16 more)

## Ambiguous Edges - Review These
- `Local Uploads Directory Media (served via /uploads/[filename])` → `Uploaded Image 1782323677351 (GWR train at station platform; not a car)`  [AMBIGUOUS]
  public/uploads/1782323677351-831jxq.webp · relation: conceptually_related_to
- `Local Uploads Directory Media (served via /uploads/[filename])` → `Uploaded Image 1782323677829 (US one-dollar bill on wood; not a car)`  [AMBIGUOUS]
  public/uploads/1782323677829-d5y9y0.webp · relation: conceptually_related_to

## Knowledge Gaps
- **863 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+858 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1100 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **78 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Local Uploads Directory Media (served via /uploads/[filename])` and `Uploaded Image 1782323677351 (GWR train at station platform; not a car)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Local Uploads Directory Media (served via /uploads/[filename])` and `Uploaded Image 1782323677829 (US one-dollar bill on wood; not a car)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `next` connect `next` to `app/page.tsx`, `roles/page.tsx`, `upload/route.ts`, `seo-text.ts`, `[brand]/page.tsx`, `site-config.ts`, `users/route.ts`, `requireAdmin`, `db.ts`, `cars/page.tsx`, `settings/page.tsx`, `PageHero`, `cn`, `normalisePhoneNumber`, `listings/page.tsx`, `connectToDatabase`, `[filename]/route.ts`, `buildMetadata`, `Button`, `package.json`, `seo.ts`, `utils.ts`, `profile/page.tsx`, `favorites/route.ts`, `admin/page.tsx`, `lucide-react`, `users/page.tsx`, `ui.tsx`, `TrafficDashboard.tsx`, `image-processing.ts`, `about/page.tsx`, `api/newsletter/route.ts`, `AdminShell.tsx`, `dealers/page.tsx`, `app/layout.tsx`, `next-auth`, `CONTAINER`, `Footer.tsx`, `AiAssistant.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `app/page.tsx`, `roles/page.tsx`, `Charts.tsx`, `[brand]/page.tsx`, `appearance/page.tsx`, `cars/page.tsx`, `settings/page.tsx`, `PageHero`, `listings/page.tsx`, `Button`, `utils.ts`, `profile/page.tsx`, `admin/page.tsx`, `lucide-react`, `users/page.tsx`, `ui.tsx`, `TrafficDashboard.tsx`, `about/page.tsx`, `app/layout.tsx`, `AdminShell.tsx`, `dealers/page.tsx`, `CONTAINER`, `Footer.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `Avatar()` connect `users/page.tsx` to `5. Re-render Optimization`, `cn`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _863 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0907103825136612 - nodes in this community are weakly interconnected._