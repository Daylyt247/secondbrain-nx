import {
  addDefaultCTConfig,
  addDefaultE2EConfig,
  addMountDefinition,
  resolveCypressConfigObject,
} from './config';

describe('Cypress Config parser', () => {
  it('should add CT config to existing e2e config', async () => {
    const actual = await addDefaultCTConfig(
      `import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: nxE2EPreset(__filename),
});
`
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { defineConfig } from 'cypress';
      import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
      export default defineConfig({
          e2e: nxE2EPreset(__filename),
          component: nxComponentTestingPreset(import.meta.dirname)
      });"
    `);
  });

  it('should add e2e config to existing CT config', async () => {
    const actual = await addDefaultE2EConfig(
      `import { defineConfig } from 'cypress';
import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';

export default defineConfig({
  component: nxComponentTestingPreset(__filename)
});
`,
      {
        cypressDir: 'cypress',
      },
      undefined
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
      import { defineConfig } from 'cypress';
      import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';
      export default defineConfig({
          component: nxComponentTestingPreset(__filename),
          e2e: {
              ...nxE2EPreset(import.meta.dirname, {
                  "cypressDir": "cypress"
              })
          }
      });"
    `);
  });

  it('should not overwrite existing config', async () => {
    const actual = await addDefaultE2EConfig(
      `import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: nxE2EPreset(__filename),
});
`,

      {
        cypressDir: 'cypress',
      },
      undefined
    );

    expect(actual).toMatchInlineSnapshot(`
      "import { defineConfig } from 'cypress';
      import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

      export default defineConfig({
        e2e: nxE2EPreset(__filename),
      });
      "
    `);
  });

  it('should merge if there are existing root level properties', async () => {
    const actual = await addDefaultE2EConfig(
      `import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  // should not remove single comment
  foo: 'bar',
  /**
  * should not remove multiline comments
  **/
  video: false
  e2e: nxE2EPreset(__filename),
});
`,

      {
        cypressDir: 'cypress',
      },
      undefined
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { defineConfig } from 'cypress';
      import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

      export default defineConfig({
        // should not remove single comment
        foo: 'bar',
        /**
        * should not remove multiline comments
        **/
        video: false
        e2e: nxE2EPreset(__filename),
      });
      "
    `);
  });

  it('should add baseUrl config', async () => {
    const actual = await addDefaultE2EConfig(
      `import { defineConfig } from 'cypress';
import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';

export default defineConfig({
});
`,
      {
        cypressDir: 'cypress',
      },
      'https://example.com'
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
      import { defineConfig } from 'cypress';
      import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';
      export default defineConfig({
          e2e: {
              ...nxE2EPreset(import.meta.dirname, {
                  "cypressDir": "cypress"
              }),
              baseUrl: 'https://example.com'
          }
      });"
    `);
  });

  it('should add nx metadata for @nx/cypress/plugin', async () => {
    const actual = await addDefaultE2EConfig(
      `import { defineConfig } from 'cypress';
import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';

export default defineConfig({
});
`,
      {
        cypressDir: 'cypress',
        webServerCommands: {
          default: 'my-app:serve',
          production: 'my-app:serve:production',
        },
        ciWebServerCommand: 'my-app:serve-static',
      },
      undefined
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
      import { defineConfig } from 'cypress';
      import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';
      export default defineConfig({
          e2e: {
              ...nxE2EPreset(import.meta.dirname, {
                  "cypressDir": "cypress",
                  "webServerCommands": {
                      "default": "my-app:serve",
                      "production": "my-app:serve:production"
                  },
                  "ciWebServerCommand": "my-app:serve-static"
              })
          }
      });"
    `);
  });

  it('should add a mount config', async () => {
    const actual = await addMountDefinition(
      `/// <reference types="cypress" />
declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      login(email: string, password: string): void;
      blah: string;
    }
  }
}
`
    );

    expect(actual).toMatchInlineSnapshot(`
      "/// <reference types="cypress" />
      declare global {
          // eslint-disable-next-line @typescript-eslint/no-namespace
          namespace Cypress {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              interface Chainable<Subject> {
                  login(email: string, password: string): void;
                  blah: string;
                  mount: typeof mount;
              }
          }
      }
      Cypress.Commands.add('mount', mount);"
    `);
  });

  it('should not overwrite mount config', async () => {
    const actual = await addMountDefinition(
      `/// <reference types="cypress" />
import { customMount } from 'something-else';
declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      login(email: string, password: string): void;
      mount: 'something-else';
    }
  }
}
Cypress.Commands.add('mount', customMount);
`
    );

    expect(actual).toMatchInlineSnapshot(`
      "/// <reference types="cypress" />
      import { customMount } from 'something-else';
      declare global {
      // eslint-disable-next-line @typescript-eslint/no-namespace
        namespace Cypress {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          interface Chainable<Subject> {
            login(email: string, password: string): void;
            mount: 'something-else';
          }
        }
      }
      Cypress.Commands.add('mount', customMount);
      "
    `);
  });

  it('should prepend a CJS require when the config uses module.exports', async () => {
    const actual = await addDefaultCTConfig(
      `const { defineConfig } = require('cypress');
module.exports = defineConfig({});
`,
      {},
      '@nx/angular/plugins/component-testing'
    );
    expect(actual).toMatchInlineSnapshot(`
      "const { nxComponentTestingPreset } = require('@nx/angular/plugins/component-testing');
      const { defineConfig } = require('cypress');
      module.exports = defineConfig({
          component: nxComponentTestingPreset(__filename)
      });"
    `);
  });

  it('should prepend an ESM import when the config uses export default', async () => {
    const actual = await addDefaultCTConfig(
      `import { defineConfig } from 'cypress';
export default defineConfig({});
`,
      {},
      '@nx/react/plugins/component-testing'
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { nxComponentTestingPreset } from '@nx/react/plugins/component-testing';
      import { defineConfig } from 'cypress';
      export default defineConfig({
          component: nxComponentTestingPreset(import.meta.dirname)
      });"
    `);
  });

  it('should pass presetImportPath through verbatim', async () => {
    // No auto-suffixing: @nx/react and @nx/angular only export the bare
    // `./plugins/component-testing` subpath; appending `.js` would break
    // strict ESM resolution with ERR_PACKAGE_PATH_NOT_EXPORTED.
    const actual = await addDefaultCTConfig(
      `const { defineConfig } = require('cypress');
module.exports = defineConfig({});
`,
      {},
      '@nx/next/plugins/component-testing'
    );
    expect(actual).toMatch(
      /^const \{ nxComponentTestingPreset \} = require\('@nx\/next\/plugins\/component-testing'\);/
    );
    expect(actual).not.toMatch(/component-testing\.js/);
  });

  it('should not prepend any import when presetImportPath is omitted', async () => {
    const actual = await addDefaultCTConfig(
      `const { defineConfig } = require('cypress');
module.exports = defineConfig({});
`,
      {}
    );
    expect(actual).not.toMatch(
      /nxComponentTestingPreset.*require|import.*nxComponentTestingPreset/
    );
  });

  it('addDefaultE2EConfig: explicit isEsmProject=true forces ESM emission even for CJS-shape input', async () => {
    // Reproduces the e2e failure where Node loads a CJS-shape `.ts` file as
    // ESM (because the project's package.json gets `type: "module"` after the
    // file was written). __filename is undefined in ESM scope, so the
    // generator must emit `import.meta.dirname` based on the project's
    // effective module system - not the file's body shape.
    const actual = await addDefaultE2EConfig(
      `const { defineConfig } = require('cypress');
module.exports = defineConfig({});
`,
      { cypressDir: 'cypress' },
      undefined,
      true
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
      const { defineConfig } = require('cypress');
      module.exports = defineConfig({
          e2e: {
              ...nxE2EPreset(import.meta.dirname, {
                  "cypressDir": "cypress"
              })
          }
      });"
    `);
  });

  it('addDefaultE2EConfig: explicit isEsmProject=false forces CJS emission even for ESM-shape input', async () => {
    const actual = await addDefaultE2EConfig(
      `import { defineConfig } from 'cypress';
export default defineConfig({});
`,
      { cypressDir: 'cypress' },
      undefined,
      false
    );
    expect(actual).toMatchInlineSnapshot(`
      "const { nxE2EPreset } = require('@nx/cypress/plugins/cypress-preset');
      import { defineConfig } from 'cypress';
      export default defineConfig({
          e2e: {
              ...nxE2EPreset(__filename, {
                  "cypressDir": "cypress"
              })
          }
      });"
    `);
  });

  it('addDefaultE2EConfig: falls back to content sniffing when isEsmProject is omitted', async () => {
    const cjs = await addDefaultE2EConfig(
      `const { defineConfig } = require('cypress');
module.exports = defineConfig({});
`,
      { cypressDir: 'cypress' },
      undefined
    );
    expect(cjs).toMatchInlineSnapshot(`
      "const { nxE2EPreset } = require('@nx/cypress/plugins/cypress-preset');
      const { defineConfig } = require('cypress');
      module.exports = defineConfig({
          e2e: {
              ...nxE2EPreset(__filename, {
                  "cypressDir": "cypress"
              })
          }
      });"
    `);

    const esm = await addDefaultE2EConfig(
      `import { defineConfig } from 'cypress';
export default defineConfig({});
`,
      { cypressDir: 'cypress' },
      undefined
    );
    expect(esm).toMatchInlineSnapshot(`
      "import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
      import { defineConfig } from 'cypress';
      export default defineConfig({
          e2e: {
              ...nxE2EPreset(import.meta.dirname, {
                  "cypressDir": "cypress"
              })
          }
      });"
    `);
  });

  it('addDefaultCTConfig: explicit isEsmProject=true forces ESM emission even for CJS-shape input', async () => {
    const actual = await addDefaultCTConfig(
      `const { defineConfig } = require('cypress');
module.exports = defineConfig({});
`,
      {},
      '@nx/react/plugins/component-testing',
      true
    );
    expect(actual).toMatchInlineSnapshot(`
      "import { nxComponentTestingPreset } from '@nx/react/plugins/component-testing';
      const { defineConfig } = require('cypress');
      module.exports = defineConfig({
          component: nxComponentTestingPreset(import.meta.dirname)
      });"
    `);
  });

  it('addDefaultCTConfig: explicit isEsmProject=false forces CJS emission even for ESM-shape input', async () => {
    const actual = await addDefaultCTConfig(
      `import { defineConfig } from 'cypress';
export default defineConfig({});
`,
      {},
      '@nx/react/plugins/component-testing',
      false
    );
    expect(actual).toMatchInlineSnapshot(`
      "const { nxComponentTestingPreset } = require('@nx/react/plugins/component-testing');
      import { defineConfig } from 'cypress';
      export default defineConfig({
          component: nxComponentTestingPreset(__filename)
      });"
    `);
  });
});

describe('resolveCypressConfigObject', () => {
  it('should handle "export default defineConfig()"', async () => {
    const config = resolveCypressConfigObject(
      `import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://example.com',
  },
});
`
    );

    expect(config).toBeDefined();
    expect(config.getText()).toMatchInlineSnapshot(`
      "{
        e2e: {
          baseUrl: 'https://example.com',
        },
      }"
    `);
  });

  it('should handle "export default {}"', async () => {
    const config = resolveCypressConfigObject(
      `export default {
  e2e: {
    baseUrl: 'https://example.com',
  },
};
  `
    );

    expect(config).toBeDefined();
    expect(config.getText()).toMatchInlineSnapshot(`
      "{
        e2e: {
          baseUrl: 'https://example.com',
        },
      }"
    `);
  });

  it('should handle "export default <variable>" when <variable> is defined in the file and is an object literal', async () => {
    const config = resolveCypressConfigObject(
      `const config = {
  e2e: {
    baseUrl: 'https://example.com',
  },
};

export default config;
`
    );

    expect(config).toBeDefined();
    expect(config.getText()).toMatchInlineSnapshot(`
      "{
        e2e: {
          baseUrl: 'https://example.com',
        },
      }"
    `);
  });

  it('should handle "module.exports = defineConfig()"', async () => {
    const config = resolveCypressConfigObject(
      `const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://example.com',
  },
});
`
    );

    expect(config).toBeDefined();
    expect(config.getText()).toMatchInlineSnapshot(`
      "{
        e2e: {
          baseUrl: 'https://example.com',
        },
      }"
    `);
  });

  it('should handle "module.exports = {}"', async () => {
    const config = resolveCypressConfigObject(
      `module.exports = {
  e2e: {
    baseUrl: 'https://example.com',
  },
};
`
    );

    expect(config).toBeDefined();
    expect(config.getText()).toMatchInlineSnapshot(`
      "{
        e2e: {
          baseUrl: 'https://example.com',
        },
      }"
    `);
  });

  it('should handle "module.exports = <variable>" when <variable> is defined in the file and is an object literal', async () => {
    const config = resolveCypressConfigObject(
      `const config = {
  e2e: {
    baseUrl: 'https://example.com',
  },
};

module.exports = config;
`
    );

    expect(config).toBeDefined();
    expect(config.getText()).toMatchInlineSnapshot(`
      "{
        e2e: {
          baseUrl: 'https://example.com',
        },
      }"
    `);
  });
});
