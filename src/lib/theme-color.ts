/** Cor da barra do sistema (theme-color) para cada tema do app. */
export const THEME_COLORS = { dark: "#14110f", light: "#f7efe6" } as const;

/**
 * Script que roda antes da hidratação: aplica a cor do tema salvo pelo next-themes
 * (chave "theme"; padrão escuro) para a barra não piscar com a cor errada.
 */
export const THEME_COLOR_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("theme")==="light"?"${THEME_COLORS.light}":"${THEME_COLORS.dark}";document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",t)})}catch(e){}})();`;
