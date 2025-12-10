// Type definitions for WeakRef and FinalizationRegistry (ES2021)
// These are global types that may not be available in all TypeScript configurations

declare global {
  /**
   * The WeakRef class represents a weak reference to an object.
   * @param T The type of the object being weakly referenced
   */
  class WeakRef<T extends object> {
    /**
     * Returns the weakly referenced object, or undefined if the object has been garbage collected.
     */
    deref(): T | undefined
  }

  /**
   * The FinalizationRegistry class provides a way to register cleanup callbacks
   * that are called when objects are garbage collected.
   * @param T The type of the held value
   */
  class FinalizationRegistry<T> {
    /**
     * Creates a new FinalizationRegistry instance.
     * @param cleanupCallback A callback function called when an object is garbage collected
     */
    constructor(cleanupCallback: (heldValue: T) => void)

    /**
     * Registers an object for finalization.
     * @param target The object to register
     * @param heldValue The value to pass to the cleanup callback
     * @param unregisterToken A token that can be used to unregister the object
     */
    register(target: object, heldValue: T, unregisterToken?: object): void

    /**
     * Unregisters an object from finalization.
     * @param unregisterToken The token passed when registering the object
     */
    unregister(unregisterToken: object): void
  }
}

export {}
