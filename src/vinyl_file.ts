export interface VinylFile extends Object {
  // Absolute path to the virtual file
  path: string;

  // Content of the virtual file
  contents: Buffer;
}
;

export function isVinylFile(obj: any): obj is VinylFile {
  return (typeof obj === 'object') && ('path' in obj) && ('contents' in obj);
};