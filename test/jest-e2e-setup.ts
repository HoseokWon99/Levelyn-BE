// Node 18 doesn't expose File as a global; testcontainers/undici requires it
import { File } from 'buffer';
if (!global.File) {
    (global as any).File = File;
}
