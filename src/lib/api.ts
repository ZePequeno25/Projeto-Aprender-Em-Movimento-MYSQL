
const API_URL = 'http://localhost:5050/api';

/**
 * Verifica se a API está disponível
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API não está disponível:', error);
    return false;
  }
};

/**
 * Faz uma requisição para a API com verificação de disponibilidade e autenticação
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);

  // Garante que o Content-Type seja definido, se não estiver presente
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Se houver um token salvo, adiciona ao cabeçalho de autorização
  const token = localStorage.getItem('authToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('⚠️ [apiFetch] Token não encontrado no localStorage para:', endpoint);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Adiciona log detalhado para todas as respostas não-OK
    // Clona a resposta para ler o body sem consumir o original
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.warn(`⚠️ [apiFetch] Sessão expirada ou acesso negado para ${endpoint}. Limpando credenciais...`);
        const currentPath = window.location.pathname;
        const isAuthRoute = currentPath.includes('/login') || currentPath.includes('/register');
        if (!isAuthRoute) {
          window.location.href = '/login?session=expired';
        }
      }
      const clonedResponse = response.clone();
      clonedResponse.text().then(errorBody => {
        console.error(
          `❌ [apiFetch] API call para ${endpoint} falhou com status ${response.status}. Corpo: ${errorBody}`
        );
      }).catch(() => {
        console.error(
          `❌ [apiFetch] API call para ${endpoint} falhou com status ${response.status}`
        );
      });
    }

    return response;
  } catch (error) {
    // Log para erros de rede (ex: falha na conexão)
    console.error(`❌ [apiFetch] Falha de rede ao conectar com a API: ${endpoint}`, error);
    // Relança o erro para que a lógica de chamada (e.g., em um hook) possa tratá-lo.
    throw error;
  }
};
