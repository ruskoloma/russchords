/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	readonly VITE_COGNITO_AUTHORITY: string;
	readonly VITE_COGNITO_CLIENT_ID: string;
	readonly VITE_COGNITO_DOMAIN: string;
	readonly VITE_COGNITO_SCOPE: string;
	readonly VITE_COGNITO_REDIRECT_URI: string;
	readonly VITE_COGNITO_LOGOUT_URI: string;
	readonly VITE_COGNITO_SILENT_REDIRECT_URI: string;
	readonly VITE_GOOGLE_SEARCH_KEY?: string;
	readonly VITE_GOOGLE_SEARCH_CX?: string;
	readonly VITE_LAMBDA_PARSER_DOMAIN?: string;
	readonly VITE_GTM_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
