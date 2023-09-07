/// <reference lib="webworker" />

import Interop from './services/interop';
import { instrumentContext } from './services/parallel';

onmessage = instrumentContext(new Interop(self.name));
