/**
 * Elementor Widget Handlers
 * Provides initialization and event handling for dynamic Elementor widgets
 */

declare global {
  interface Window {
    jQuery: any
    $: any
    elementorFrontend: any
    elementorProFrontend: any
    Swiper: any
    elementorFrontendConfig: any
    ElementorProFrontendConfig: any
  }
}

export class ElementorWidgetHandlers {
  /**
   * Initialize all Elementor widgets on the page
   */
  static initializeAll(container: HTMLElement): void {
    console.log('🎯 Initializing all Elementor widgets...')
    
    // Wait for Elementor frontend to be ready
    this.waitForElementor(() => {
      // Initialize different widget types
      this.initializeSliders(container)
      this.initializeCarousels(container)
      this.initializeForms(container)
      this.initializeTabs(container)
      this.initializeAccordions(container)
      this.initializeCounters(container)
      this.initializeProgressBars(container)
      this.initializeImageGallery(container)
      this.initializeLightbox(container)
      this.initializeAnimations(container)
      this.initializeVideos(container)
      this.initializeTestimonials(container)
      this.initializeNavMenus(container)
      this.initializePopups(container)
    })
  }

  /**
   * Wait for Elementor frontend to be available
   */
  private static waitForElementor(callback: () => void): void {
    if (typeof window !== 'undefined' && window.elementorFrontend) {
      callback()
    } else {
      setTimeout(() => this.waitForElementor(callback), 100)
    }
  }

  /**
   * Initialize Slider widgets
   */
  static initializeSliders(container: HTMLElement): void {
    const sliders = container.querySelectorAll('[data-widget_type*="slider"]')
    
    sliders.forEach((slider) => {
      const widgetId = slider.getAttribute('data-id')
      console.log(`🎠 Initializing slider: ${widgetId}`)
      
      const swiperContainer = slider.querySelector('.swiper-container, .swiper')
      if (swiperContainer && window.Swiper) {
        try {
          const settingsAttr = slider.getAttribute('data-settings')
          let settings: any = {
            loop: true,
            autoplay: {
              delay: 5000,
              disableOnInteraction: false,
            },
            speed: 1000,
            navigation: {
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            },
            pagination: {
              el: '.swiper-pagination',
              clickable: true,
              type: 'bullets',
            },
          }

          if (settingsAttr) {
            try {
              const parsedSettings = JSON.parse(settingsAttr)
              settings = { ...settings, ...parsedSettings }
            } catch (error) {
              console.warn('Could not parse slider settings:', error)
            }
          }

          new window.Swiper(swiperContainer, settings)
          console.log(`✅ Slider initialized: ${widgetId}`)
        } catch (error) {
          console.error(`Error initializing slider ${widgetId}:`, error)
        }
      }
    })
  }

  /**
   * Initialize Carousel widgets
   */
  static initializeCarousels(container: HTMLElement): void {
    const carousels = container.querySelectorAll('[data-widget_type*="carousel"]')
    
    carousels.forEach((carousel) => {
      const widgetId = carousel.getAttribute('data-id')
      console.log(`🎪 Initializing carousel: ${widgetId}`)
      
      const swiperContainer = carousel.querySelector('.swiper-container, .swiper')
      if (swiperContainer && window.Swiper) {
        try {
          const settingsAttr = carousel.getAttribute('data-settings')
          let settings: any = {
            loop: true,
            autoplay: {
              delay: 3000,
              disableOnInteraction: false,
            },
            speed: 800,
            slidesPerView: 3,
            spaceBetween: 30,
            navigation: {
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            },
            pagination: {
              el: '.swiper-pagination',
              clickable: true,
            },
            breakpoints: {
              320: {
                slidesPerView: 1,
                spaceBetween: 10,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
            },
          }

          if (settingsAttr) {
            try {
              const parsedSettings = JSON.parse(settingsAttr)
              settings = { ...settings, ...parsedSettings }
            } catch (error) {
              console.warn('Could not parse carousel settings:', error)
            }
          }

          new window.Swiper(swiperContainer, settings)
          console.log(`✅ Carousel initialized: ${widgetId}`)
        } catch (error) {
          console.error(`Error initializing carousel ${widgetId}:`, error)
        }
      }
    })
  }

  /**
   * Initialize Form widgets
   */
  static initializeForms(container: HTMLElement): void {
    const forms = container.querySelectorAll('[data-widget_type*="form"]')
    
    forms.forEach((formWidget) => {
      const widgetId = formWidget.getAttribute('data-id')
      console.log(`📝 Initializing form: ${widgetId}`)
      
      const form = formWidget.querySelector('form') as HTMLFormElement
      if (form && form.parentNode) {
        try {
          // Remove existing event listeners by cloning
          const newForm = form.cloneNode(true) as HTMLFormElement
          
          // Safely replace the form only if parent exists
          if (form.parentNode) {
            form.parentNode.replaceChild(newForm, form)
          } else {
            console.warn('Form parent node not found, using original form')
            return
          }

          // Add form submission handler
          newForm.addEventListener('submit', async (e) => {
          e.preventDefault()
          console.log('Form submission for:', widgetId)

          const submitButton = newForm.querySelector('[type="submit"]') as HTMLButtonElement
          const originalText = submitButton?.textContent || 'Submit'
          
          if (submitButton) {
            submitButton.disabled = true
            submitButton.textContent = 'Sending...'
          }

          try {
            const formData = new FormData(newForm)
            const data: any = {}
            formData.forEach((value, key) => {
              data[key] = value
            })

            // Try to submit via Elementor Pro AJAX if available
            if (window.elementorProFrontend) {
              // Elementor Pro form submission
              const action = newForm.getAttribute('data-form-action') || 'elementor_pro_forms_send_form'
              data.action = action
              data.post_id = document.querySelector('[data-elementor-id]')?.getAttribute('data-elementor-id')
              data.form_id = widgetId

              const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || window.location.origin
              const response = await fetch(`${wpUrl}/wp-admin/admin-ajax.php`, {
                method: 'POST',
                body: new URLSearchParams(data),
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              })

              const result = await response.json()
              
              if (result.success) {
                this.showFormMessage(newForm, 'success', result.data?.message || 'Form submitted successfully!')
                newForm.reset()
              } else {
                this.showFormMessage(newForm, 'error', result.data?.message || 'Form submission failed.')
              }
            } else {
              // Fallback: Basic form handling
              console.log('Form data:', data)
              this.showFormMessage(newForm, 'success', 'Form submitted! (Elementor Pro not available)')
              newForm.reset()
            }
          } catch (error) {
            console.error('Form submission error:', error)
            this.showFormMessage(newForm, 'error', 'An error occurred. Please try again.')
          } finally {
            if (submitButton) {
              submitButton.disabled = false
              submitButton.textContent = originalText
            }
          }
          })

          console.log(`✅ Form initialized: ${widgetId}`)
        } catch (error) {
          console.error(`Error initializing form ${widgetId}:`, error)
          // Fallback: add event listener to original form if clone fails
          if (form && form.parentNode) {
            form.addEventListener('submit', async (e) => {
              e.preventDefault()
              console.log('Form submission (fallback):', widgetId)
            })
          }
        }
      }
    })
  }

  /**
   * Show form message
   */
  private static showFormMessage(form: HTMLFormElement, type: 'success' | 'error', message: string): void {
    if (!form) return

    try {
      const existingMessage = form.querySelector('.elementor-message')
      if (existingMessage && existingMessage.parentNode) {
        existingMessage.parentNode.removeChild(existingMessage)
      }

      const messageDiv = document.createElement('div')
      messageDiv.className = `elementor-message elementor-message-${type}`
      messageDiv.textContent = message
      messageDiv.style.cssText = `
        padding: 15px;
        margin: 15px 0;
        border-radius: 5px;
        background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
      `
      
      if (form.firstChild) {
        form.insertBefore(messageDiv, form.firstChild)
      } else {
        form.appendChild(messageDiv)
      }

      // Remove message after 5 seconds
      setTimeout(() => {
        if (messageDiv && messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv)
        }
      }, 5000)
    } catch (error) {
      console.error('Error showing form message:', error)
    }
  }

  /**
   * Initialize Tab widgets
   */
  static initializeTabs(container: HTMLElement): void {
    const tabWidgets = container.querySelectorAll('[data-widget_type="tabs"]')
    
    tabWidgets.forEach((widget) => {
      const widgetId = widget.getAttribute('data-id')
      console.log(`📑 Initializing tabs: ${widgetId}`)
      
      const tabs = widget.querySelectorAll('.elementor-tab-title')
      const contents = widget.querySelectorAll('.elementor-tab-content')
      
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs and contents
          tabs.forEach(t => t.classList.remove('elementor-active'))
          contents.forEach(c => c.classList.remove('elementor-active'))
          
          // Add active class to clicked tab and corresponding content
          tab.classList.add('elementor-active')
          if (contents[index]) {
            contents[index].classList.add('elementor-active')
          }
        })
      })
      
      console.log(`✅ Tabs initialized: ${widgetId}`)
    })
  }

  /**
   * Initialize Accordion widgets
   */
  static initializeAccordions(container: HTMLElement): void {
    const accordions = container.querySelectorAll('[data-widget_type="accordion"]')
    
    accordions.forEach((widget) => {
      const widgetId = widget.getAttribute('data-id')
      console.log(`🪗 Initializing accordion: ${widgetId}`)
      
      const items = widget.querySelectorAll('.elementor-accordion-item')
      
      items.forEach((item) => {
        const title = item.querySelector('.elementor-tab-title')
        const content = item.querySelector('.elementor-tab-content')
        
        if (title && content) {
          title.addEventListener('click', () => {
            const isActive = title.classList.contains('elementor-active')
            
            // Close all items
            items.forEach(i => {
              i.querySelector('.elementor-tab-title')?.classList.remove('elementor-active')
              i.querySelector('.elementor-tab-content')?.classList.remove('elementor-active')
            })
            
            // Open clicked item if it wasn't active
            if (!isActive) {
              title.classList.add('elementor-active')
              content.classList.add('elementor-active')
            }
          })
        }
      })
      
      console.log(`✅ Accordion initialized: ${widgetId}`)
    })
  }

  /**
   * Initialize Counter widgets
   */
  static initializeCounters(container: HTMLElement): void {
    const counters = container.querySelectorAll('[data-widget_type="counter"]')
    
    counters.forEach((counter) => {
      const widgetId = counter.getAttribute('data-id')
      const numberElement = counter.querySelector('.elementor-counter-number') as HTMLElement
      
      if (numberElement) {
        const targetValue = parseInt(numberElement.getAttribute('data-to-value') || numberElement.textContent || '0')
        const duration = parseInt(numberElement.getAttribute('data-duration') || '2000')
        
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animateCounter(numberElement, 0, targetValue, duration)
              observer.unobserve(entry.target)
            }
          })
        })
        
        observer.observe(counter)
        console.log(`✅ Counter initialized: ${widgetId}`)
      }
    })
  }

  /**
   * Animate counter
   */
  private static animateCounter(element: HTMLElement, start: number, end: number, duration: number): void {
    const startTime = Date.now()
    
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const value = Math.floor(progress * (end - start) + start)
      
      element.textContent = value.toString()
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  /**
   * Initialize Progress Bar widgets
   */
  static initializeProgressBars(container: HTMLElement): void {
    const progressBars = container.querySelectorAll('[data-widget_type="progress"]')
    
    progressBars.forEach((widget) => {
      const widgetId = widget.getAttribute('data-id')
      const progressBar = widget.querySelector('.elementor-progress-bar') as HTMLElement
      
      if (progressBar) {
        const percentage = progressBar.getAttribute('data-max') || '100'
        
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              progressBar.style.width = `${percentage}%`
              observer.unobserve(entry.target)
            }
          })
        })
        
        observer.observe(widget)
        console.log(`✅ Progress bar initialized: ${widgetId}`)
      }
    })
  }

  /**
   * Initialize Image Gallery widgets
   */
  static initializeImageGallery(container: HTMLElement): void {
    const galleries = container.querySelectorAll('[data-widget_type="image-gallery"]')
    
    galleries.forEach((gallery) => {
      const widgetId = gallery.getAttribute('data-id')
      console.log(`🖼️ Initializing image gallery: ${widgetId}`)
      
      // Gallery functionality handled by lightbox
      console.log(`✅ Image gallery initialized: ${widgetId}`)
    })
  }

  /**
   * Initialize Lightbox for images
   */
  static initializeLightbox(container: HTMLElement): void {
    const lightboxElements = container.querySelectorAll('[data-elementor-lightbox], [data-elementor-open-lightbox]')
    
    lightboxElements.forEach((element) => {
      element.addEventListener('click', (e) => {
        e.preventDefault()
        const imageUrl = element.getAttribute('href') || element.getAttribute('data-elementor-lightbox-slideshow')
        
        if (imageUrl && window.elementorFrontend) {
          // Use Elementor's built-in lightbox if available
          if (window.elementorFrontend.utils && window.elementorFrontend.utils.lightbox) {
            window.elementorFrontend.utils.lightbox.createLightbox(element)
          } else {
            // Fallback: Open image in a simple modal
            this.openSimpleLightbox(imageUrl)
          }
        }
      })
    })
    
    console.log('✅ Lightbox initialized for', lightboxElements.length, 'elements')
  }

  /**
   * Open simple lightbox (fallback)
   */
  private static openSimpleLightbox(imageUrl: string): void {
    try {
      const lightbox = document.createElement('div')
      lightbox.className = 'simple-lightbox'
      lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        cursor: pointer;
      `
      
      const img = document.createElement('img')
      img.src = imageUrl
      img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
      `
      
      lightbox.appendChild(img)
      document.body.appendChild(lightbox)
      
      lightbox.addEventListener('click', () => {
        if (lightbox && lightbox.parentNode) {
          lightbox.parentNode.removeChild(lightbox)
        }
      })
    } catch (error) {
      console.error('Error opening lightbox:', error)
    }
  }

  /**
   * Initialize Animations
   */
  static initializeAnimations(container: HTMLElement): void {
    const animatedElements = container.querySelectorAll('[data-settings*="animation"]')
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('elementor-animation-active', 'animated')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    animatedElements.forEach((element) => {
      observer.observe(element)
    })
    
    console.log('✅ Animations initialized for', animatedElements.length, 'elements')
  }

  /**
   * Initialize Video widgets
   */
  static initializeVideos(container: HTMLElement): void {
    const videos = container.querySelectorAll('[data-widget_type*="video"]')
    
    videos.forEach((widget) => {
      const widgetId = widget.getAttribute('data-id')
      const videoElement = widget.querySelector('video, iframe')
      
      if (videoElement) {
        // Video-specific initialization
        console.log(`✅ Video initialized: ${widgetId}`)
      }
    })
  }

  /**
   * Initialize Testimonial widgets
   */
  static initializeTestimonials(container: HTMLElement): void {
    const testimonials = container.querySelectorAll('[data-widget_type*="testimonial"]')
    
    testimonials.forEach((widget) => {
      const widgetId = widget.getAttribute('data-id')
      const swiperContainer = widget.querySelector('.swiper-container, .swiper')
      
      if (swiperContainer && window.Swiper) {
        new window.Swiper(swiperContainer, {
          loop: true,
          autoplay: {
            delay: 5000,
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
        })
        console.log(`✅ Testimonial carousel initialized: ${widgetId}`)
      }
    })
  }

  /**
   * Initialize Navigation Menu widgets
   */
  static initializeNavMenus(container: HTMLElement): void {
    const navMenus = container.querySelectorAll('[data-widget_type="nav-menu"]')
    
    navMenus.forEach((widget) => {
      const widgetId = widget.getAttribute('data-id')
      const toggle = widget.querySelector('.elementor-menu-toggle')
      const menu = widget.querySelector('.elementor-nav-menu')
      
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          menu.classList.toggle('elementor-nav-menu--open')
        })
        console.log(`✅ Nav menu initialized: ${widgetId}`)
      }
    })
  }

  /**
   * Initialize Popup widgets
   */
  static initializePopups(container: HTMLElement): void {
    const popupTriggers = container.querySelectorAll('[data-elementor-open-popup]')
    
    popupTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault()
        const popupId = trigger.getAttribute('data-elementor-open-popup')
        console.log('Opening popup:', popupId)
        
        // Elementor Pro popup handling
        if (window.elementorProFrontend) {
          window.elementorProFrontend.modules.popup.showPopup({ id: popupId })
        }
      })
    })
    
    console.log('✅ Popups initialized for', popupTriggers.length, 'triggers')
  }
}

