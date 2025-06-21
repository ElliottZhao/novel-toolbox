import { load, Element } from 'cheerio';
import vm from 'vm';

export function extractInitialState(content: string): any {
  try {
    const $ = load(content);
    const scripts = $('script');
    let initialState: any = null;

    scripts.each((i: number, script: Element) => {
      const scriptContent = $(script).html();
      if (scriptContent && scriptContent.includes('window.__INITIAL_STATE__=')) {
        try {
          const windowObj: { __INITIAL_STATE__?: any } = {};
          const context = vm.createContext({ window: windowObj });
          vm.runInContext(scriptContent, context);

          initialState = windowObj.__INITIAL_STATE__;

          if (initialState) {
            return false; // break each loop
          }
        } catch (e) {
          // Log inner error but continue searching
          console.error('Error executing script to get initial state from a script tag', e);
        }
      }
    });
    return initialState;
  } catch (e) {
    console.error('Failed to extract initial state', e);
    return null;
  }
} 