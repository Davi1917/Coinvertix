import { mensagemFirebase, validarEmailObrigatorio, validarFormatoEmail, validarTamanhoSenha, validarConfirmacaoSenha, validarValorConversao, formatarMoeda, calcularConversao, limitarCaracteresNome, traduzirTipoTransacao, validarCamposTransacao } from './login';
// 1. Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// 2. Mock do arquivo local de configuração do Firebase
jest.mock('../../lib/firebase', () => ({
  auth: {},
}));

// 3. NOVO: Mock completo do pacote oficial 'firebase/auth' (Corta o erro do 'export')
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// 4. Mock do Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

describe('Módulo de Autenticação - Testes de Unidade (Controle de Qualidade)', () => {

  it('Deve traduzir o erro de credenciais inválidas para o português correto', () => {
    const resultado = mensagemFirebase('auth/invalid-credential');
    expect(resultado).toBe('E-mail ou senha incorretos.');
  });

  it('Deve acusar erro de infraestrutura caso a internet caia', () => {
    const resultado = mensagemFirebase('auth/network-request-failed');
    expect(resultado).toBe('Sem conexão. Verifique sua internet.');
  });

  it('Deve retornar a mensagem de segurança genérica para erros não catalogados', () => {
    const resultado = mensagemFirebase('erro/codigo-aleatorio');
    expect(resultado).toBe('Ocorreu um erro. Tente novamente.');
  });

  // --- TESTES DE UNIDADE ---

  // --- Teste 1: Validação de E-mail Obrigatório ---

describe('Função: validarEmailObrigatorio', () => {

    it('Deve retornar false se o e-mail for uma string vazia', () => {
      const resultado = validarEmailObrigatorio("");
      expect(resultado).toBe(false);
    });

    it('Deve retornar false se o e-mail tiver apenas espaços em branco', () => {
      const resultado = validarEmailObrigatorio("   ");
      expect(resultado).toBe(false);
    });

    it('Deve retornar true se o e-mail estiver preenchido corretamente', () => {
      const resultado = validarEmailObrigatorio("aluno@coinvertix.com");
      expect(resultado).toBe(true);
    });

  });
    // --- Teste 2: Formato de E-mail Válido ---
  describe('Função: validarFormatoEmail', () => {

    it('Deve retornar false se o e-mail não tiver o símbolo @', () => {
      const resultado = validarFormatoEmail("alunocoinvertix.com");
      expect(resultado).toBe(false);
    });

    it('Deve retornar false se o e-mail não tiver um domínio válido (ex: .com)', () => {
      const resultado = validarFormatoEmail("aluno@coinvertix");
      expect(resultado).toBe(false);
    });

    it('Deve retornar true se o e-mail tiver um formato perfeitamente válido', () => {
      const resultado = validarFormatoEmail("aluno@coinvertix.com");
      expect(resultado).toBe(true);
    });

  });
  // --- Teste 3: Tamanho Mínimo da Senha ---
  describe('Função: validarTamanhoSenha', () => {

    it('Deve retornar false se a senha tiver menos de 6 caracteres', () => {
      const resultado = validarTamanhoSenha("123");
      expect(resultado).toBe(false);
    });

    it('Deve retornar true se a senha tiver exatamente 6 caracteres', () => {
      const resultado = validarTamanhoSenha("123456");
      expect(resultado).toBe(true);
    });

    it('Deve retornar true se a senha for mais longa que 6 caracteres', () => {
      const resultado = validarTamanhoSenha("senhaSuperSegura123");
      expect(resultado).toBe(true);
    });

  });
  // --- Teste 4: Confirmação de Senha Igual ---
  describe('Função: validarConfirmacaoSenha', () => {

    it('Deve retornar false se as senhas forem totalmente diferentes', () => {
      const resultado = validarConfirmacaoSenha("123456", "abcdef");
      expect(resultado).toBe(false);
    });

    it('Deve retornar false se houver diferença apenas de uma letra ou número', () => {
      const resultado = validarConfirmacaoSenha("123456", "123457");
      expect(resultado).toBe(false);
    });

    it('Deve retornar true se as duas senhas forem perfeitamente idênticas', () => {
      const resultado = validarConfirmacaoSenha("senha123", "senha123");
      expect(resultado).toBe(true);
    });

  });

  // --- Teste 5: Bloqueio de Valores Negativos ---
  describe('Função: validarValorConversao', () => {

    it('Deve retornar false se o valor inserido for negativo', () => {
      const resultado = validarValorConversao(-50.00);
      expect(resultado).toBe(false);
    });

    it('Deve retornar false se o valor inserido for exatamente zero', () => {
      const resultado = validarValorConversao(0);
      expect(resultado).toBe(false);
    });

    it('Deve retornar true se o valor for positivo e válido para conversão', () => {
      const resultado = validarValorConversao(150.50);
      expect(resultado).toBe(true);
    });

  });

  // --- Teste 6: Formatação de Moeda ---
  describe('Função: formatarMoeda', () => {
    it('Deve formatar um número como moeda Real (R$)', () => {
      // Usamos toContain para ignorar o caractere de espaço invisível do Node.js
      expect(formatarMoeda(10)).toContain('R$');
      expect(formatarMoeda(10)).toContain('10,00');
    });
  });

  // --- Teste 7: Cálculo de Conversão Simples ---
  describe('Função: calcularConversao', () => {
    it('Deve multiplicar o valor corretamente pela taxa de câmbio', () => {
      expect(calcularConversao(10, 5.5)).toBe(55);
    });
  });

  // --- Teste 8: Limitação de Caracteres no Nome ---
  describe('Função: limitarCaracteresNome', () => {
    it('Deve rejeitar nomes excessivamente longos (mais de 50 caracteres)', () => {
      expect(limitarCaracteresNome("Nome ".repeat(15))).toBe(false);
    });
    it('Deve aceitar nomes dentro do limite permitido', () => {
      expect(limitarCaracteresNome("Davi Silva")).toBe(true);
    });
  });

  // --- Teste 9: Tradução de Tipos de Transação ---
  describe('Função: traduzirTipoTransacao', () => {
    it('Deve traduzir "income" para "Entrada"', () => {
      expect(traduzirTipoTransacao("income")).toBe("Entrada");
    });
    it('Deve traduzir "expense" para "Saída"', () => {
      expect(traduzirTipoTransacao("expense")).toBe("Saída");
    });
  });

  // --- Teste 10: Validação de Campos da Transação ---
  describe('Função: validarCamposTransacao', () => {
    it('Deve retornar false se o valor for zero ou a descrição for vazia', () => {
      expect(validarCamposTransacao(0, "Almoço")).toBe(false);
      expect(validarCamposTransacao(10, "")).toBe(false);
    });
    it('Deve retornar true se ambos os campos estiverem preenchidos corretamente', () => {
      expect(validarCamposTransacao(25.50, "Gasolina")).toBe(true);
    });
  });

  // --- TESTES DE INTEGRAÇÃO --- 

  describe('Teste de Integração 11: Fluxo de Validação de Login', () => {

    it('Deve barrar o avanço do fluxo se o e-mail estiver preenchido mas com formato inválido', () => {
      // 1. O usuário digita os dados na tela (Simulação)
      const inputEmail = "usuario_sem_arroba.com"; 
      const inputSenha = "senhaValida123";

      // 2. A esteira de integração do Coinvertix começa a validar sequencialmente
      const passo1_obrigatorio = validarEmailObrigatorio(inputEmail);
      const passo2_formato     = validarFormatoEmail(inputEmail);
      const passo3_senha       = validarTamanhoSenha(inputSenha);

      // 3. Integração lógica: o fluxo do app só prossegue se TODOS os passos forem 'true'
      const fluxoEstaLiberado = passo1_obrigatorio && passo2_formato && passo3_senha;

      // 4. Resultado esperado: Como o e-mail não tem @, o fluxo DEVE ser false (bloqueado)
      expect(fluxoEstaLiberado).toBe(false);
    });

    it('Deve liberar o avanço para o Firebase se todos os dados integrados estiverem corretos', () => {
      const inputEmail = "davi@coinvertix.com";
      const inputSenha = "senhaValida123";

      // A esteira roda novamente com dados corretos
      const passo1_obrigatorio = validarEmailObrigatorio(inputEmail);
      const passo2_formato     = validarFormatoEmail(inputEmail);
      const passo3_senha       = validarTamanhoSenha(inputSenha);

      const fluxoEstaLiberado = passo1_obrigatorio && passo2_formato && passo3_senha;

      // Resultado esperado: Tudo certo, o fluxo DEVE ser true (liberado para logar)
      expect(fluxoEstaLiberado).toBe(true);
    });

  });

});