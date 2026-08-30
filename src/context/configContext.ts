import { createContext } from 'react';

import type { ConfigService } from '../types/config.types';

export const ConfigContext = createContext<ConfigService | null>(null);
