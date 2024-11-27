export class Path {
  constructor(
    /**
     * The path value as an array of strings.
     */
    readonly value: string[] = [],
  ) {}

  /**
   * Convert the path to a string key with the given delimiter (Default is ".")
   *
   * Example:
   *
   * ```ts
   * const path = new Path(["a", "b", "c"]);
   * path.asKey(); // "a.b.c"
   * ```
   */
  asKey(delimiter = ".") {
    return this.value.join(delimiter);
  }

  /**
   * Get the last element of the path.
   *
   * Example:
   *
   * ```ts
   * const path = new Path(["a", "b", "c"]);
   * path.getName(); // "c"
   * ```
   */
  getName() {
    return this.value[this.value.length - 1];
  }

  /**
   * Get the parent path of the current path.
   * If the path is empty, it will return undefined.
   *
   * Example:
   *
   * ```ts
   * const path = new Path(["a", "b", "c"]);
   * path.getParent(); // Path(["a", "b"])
   * ```
   */
  getParent() {
    if (this.value.length === 0) {
      return;
    }

    return new Path(this.value.slice(0, this.value.length - 1));
  }

  /**
   * Get the level of the path
   *
   * The level is the number of elements in the path.
   */
  getLevel() {
    return this.value.length;
  }

  /**
   * Append a path to the current path.
   */
  append(path: Path | string) {
    return new Path([
      ...this.value,
      ...(path instanceof Path ? path.value : [path]),
    ]);
  }

  /**
   * Get the path instance with the root offset by the given start index.
   */
  rootOffset(start: number) {
    const sliced = this.value.slice(start);
    if (sliced.length === 0) {
      return null;
    }

    return new Path(sliced);
  }
}
