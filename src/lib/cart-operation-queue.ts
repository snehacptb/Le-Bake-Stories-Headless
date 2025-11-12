/**
 * Cart Operation Queue
 * Prevents concurrent cart operations that cause 409 Conflict errors
 * Ensures operations are executed sequentially with proper session management
 */

type CartOperation = () => Promise<any>

class CartOperationQueue {
  private queue: Array<{ operation: CartOperation; resolve: (value: any) => void; reject: (error: any) => void }> = []
  private isProcessing = false
  private lastOperationTime = 0
  private minDelayBetweenOperations = 100 // ms between operations

  /**
   * Add an operation to the queue
   */
  async enqueue<T>(operation: CartOperation): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject })
      this.processQueue()
    })
  }

  /**
   * Process the queue sequentially
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      const { operation, resolve, reject } = this.queue.shift()!

      try {
        // Ensure minimum delay between operations to prevent conflicts
        const timeSinceLastOp = Date.now() - this.lastOperationTime
        if (timeSinceLastOp < this.minDelayBetweenOperations) {
          await new Promise(r => setTimeout(r, this.minDelayBetweenOperations - timeSinceLastOp))
        }

        const result = await operation()
        this.lastOperationTime = Date.now()
        resolve(result)
      } catch (error) {
        this.lastOperationTime = Date.now()
        reject(error)
      }
    }

    this.isProcessing = false
  }

  /**
   * Clear all pending operations
   */
  clear() {
    this.queue.forEach(({ reject }) => {
      reject(new Error('Operation cancelled: Queue cleared'))
    })
    this.queue = []
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }
}

// Export singleton instance
export const cartOperationQueue = new CartOperationQueue()
