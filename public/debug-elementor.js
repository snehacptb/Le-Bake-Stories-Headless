// Elementor Debug Script
// Add this to your page to intercept removeChild errors and identify the source

(function() {
  console.log('🔍 Elementor Debug Mode Activated');

  // Store the original removeChild method
  const originalRemoveChild = Node.prototype.removeChild;
  const originalReplaceChild = Node.prototype.replaceChild;
  const originalAppendChild = Node.prototype.appendChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  // Override removeChild to catch errors
  Node.prototype.removeChild = function(child) {
    try {
      if (!this || !child) {
        console.error('❌ removeChild called with null:', {
          parent: this,
          child: child,
          stack: new Error().stack
        });
        return child;
      }
      
      if (child.parentNode !== this) {
        console.warn('⚠️ Attempting to remove child from wrong parent:', {
          expectedParent: this,
          actualParent: child.parentNode,
          child: child,
          stack: new Error().stack
        });
      }
      
      return originalRemoveChild.call(this, child);
    } catch (error) {
      console.error('❌ Error in removeChild:', {
        error: error,
        parent: this,
        child: child,
        stack: new Error().stack
      });
      // Don't throw, just return the child
      return child;
    }
  };

  // Override replaceChild to catch errors
  Node.prototype.replaceChild = function(newChild, oldChild) {
    try {
      if (!this || !newChild || !oldChild) {
        console.error('❌ replaceChild called with null:', {
          parent: this,
          newChild: newChild,
          oldChild: oldChild,
          stack: new Error().stack
        });
        return oldChild;
      }
      
      if (oldChild.parentNode !== this) {
        console.warn('⚠️ Attempting to replace child in wrong parent:', {
          expectedParent: this,
          actualParent: oldChild.parentNode,
          oldChild: oldChild,
          stack: new Error().stack
        });
      }
      
      return originalReplaceChild.call(this, newChild, oldChild);
    } catch (error) {
      console.error('❌ Error in replaceChild:', {
        error: error,
        parent: this,
        newChild: newChild,
        oldChild: oldChild,
        stack: new Error().stack
      });
      // Try to recover
      try {
        return originalAppendChild.call(this, newChild);
      } catch (e) {
        return oldChild;
      }
    }
  };

  console.log('✅ DOM manipulation methods are now being monitored');
  console.log('📊 Any removeChild/replaceChild errors will be logged with stack traces');
})();

