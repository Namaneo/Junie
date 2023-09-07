/// <reference lib="webworker" />

import Interop from ' Interop ';
import { instrumentContext } from ' { instrumentContext } ';

onmessage = instrumentContext(new Interop(self.name));
