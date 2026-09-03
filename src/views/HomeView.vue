<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useCartStore } from '@/stores/CartStore';
import { useThemeStore } from '@/stores/ThemeStore';
import { storeToRefs } from 'pinia';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import CartBoardPanel from '@/components/cart/CartBoardPanel.vue';
import FavoritesTemplatesPanel from '@/components/favorites/FavoritesTemplatesPanel.vue';
import FoodFactsPanel from '@/components/food-facts/FoodFactsPanel.vue';
import NearbyPlacesView from '@/views/NearbyPlacesView.vue';
import RecipeCard from '@/components/recipes/RecipeCard.vue';
import RecipeDetailsModal from '@/components/recipes/RecipeDetailsModal.vue';
import RecipesToolbar from '@/components/recipes/RecipesToolbar.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { extractCoreNutrients } from '@/services/foodFactsApi';

export default {
  components: {
    AppHeader,
    AppFooter,
    CartBoardPanel,
    FavoritesTemplatesPanel,
    FoodFactsPanel,
    NearbyPlacesView,
    RecipeCard,
    RecipeDetailsModal,
    RecipesToolbar,
    ConfirmDialog,
  },

  setup() {
    const cartStore = useCartStore();
    const themeStore = useThemeStore();
    const filter = ref('All');
    const recipeLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const recipeSearchQuery = ref('');
    const selectedRecipeLetter = ref('All');
    const selectedRecipeCategory = ref('All');
    const recipeCategories = ref([]);
    const recipes = ref([]);
    const recipesLoading = ref(false);
    const recipesError = ref('');
    const favoritesTemplateFilter = ref('cart');
    const isRecipeFiltersOpen = ref(false);
    const selectedRecipe = ref(null);
    const isRecipeModalOpen = ref(false);
    const recipeModalLoading = ref(false);
    const showSplash = ref(true);
    const copyrightYear = ref(new Date().getFullYear());
    let yearIntervalId = null;
    let recipeSearchTimeoutId = null;
    const mealDbBaseUrl = 'https://www.themealdb.com/api/json/v1/1';
    const supportedRecipeUnits = {
      g: 'gram',
      gram: 'gram',
      grams: 'gram',
      kg: 'kilo',
      kilo: 'kilo',
      kilos: 'kilo',
      kilogram: 'kilo',
      kilograms: 'kilo',
      ml: 'milliliter',
      milliliter: 'milliliter',
      milliliters: 'milliliter',
      l: 'liter',
      liter: 'liter',
      liters: 'liter',
      oz: 'ounces',
      ounce: 'ounces',
      ounces: 'ounces',
      lb: 'pound',
      lbs: 'pound',
      pound: 'pound',
      pounds: 'pound',
      piece: 'pieces',
      pieces: 'pieces',
      pc: 'pieces',
      pcs: 'pieces',
      clove: 'pieces',
      cloves: 'pieces',
      slice: 'pieces',
      slices: 'pieces',
      can: 'pieces',
      cans: 'pieces',
    };

    const updateCopyrightYear = () => {
      copyrightYear.value = new Date().getFullYear();
    };

    const normalizeRecipes = (meals = []) =>
      [...meals].sort((firstRecipe, secondRecipe) =>
        firstRecipe.strMeal.localeCompare(secondRecipe.strMeal),
      );

    const makeSafeFileName = (value) =>
      (value || 'recipe')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const loadImageForPdf = async (url) => {
      if (!url) return null;
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        const sourceDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        const imageElement = await new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => resolve(null);
          image.src = sourceDataUrl;
        });

        if (!imageElement) return null;

        const width = imageElement.naturalWidth;
        const height = imageElement.naturalHeight;

        if (!width || !height) return null;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) return null;

        context.drawImage(imageElement, 0, 0, width, height);
        const pngDataUrl = canvas.toDataURL('image/png');

        return {
          dataUrl: pngDataUrl,
          width,
          height,
          format: 'PNG',
        };
      } catch {
        return null;
      }
    };

    const toRecipeIngredients = (recipe) => {
      if (!recipe) return [];

      return Array.from({ length: 20 }, (_, index) => index + 1)
        .map((ingredientIndex) => {
          const ingredient = recipe[`strIngredient${ingredientIndex}`]?.trim();
          const measure = recipe[`strMeasure${ingredientIndex}`]?.trim();
          if (!ingredient) return null;
          return {
            ingredient,
            measure: measure || 'As needed',
            thumbnail: `https://www.themealdb.com/images/ingredients/${ingredient.replace(/\s+/g, '_')}-small.png`,
          };
        })
        .filter(Boolean);
    };

    const downloadRecipePdf = async (recipe) => {
      if (!recipe) return;

      let recipeForPdf = recipe;
      let ingredientsForPdf = toRecipeIngredients(recipeForPdf);

      if (ingredientsForPdf.length === 0 && recipe.idMeal) {
        try {
          const response = await fetch(
            `${mealDbBaseUrl}/lookup.php?i=${encodeURIComponent(recipe.idMeal)}`,
          );

          if (response.ok) {
            const data = await response.json();
            const fullRecipe = data.meals?.[0];

            if (fullRecipe) {
              recipeForPdf = fullRecipe;
              ingredientsForPdf = toRecipeIngredients(recipeForPdf);
            }
          }
        } catch {
          // Best effort enrichment for PDF generation.
        }
      }

      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(recipeForPdf.strMeal || 'Recipe', margin, currentY);
      currentY += 24;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const metaLine = [
        recipeForPdf.strCategory || 'Recipe',
        recipeForPdf.strArea || null,
      ]
        .filter(Boolean)
        .join(' • ');
      if (metaLine) {
        doc.text(metaLine, margin, currentY);
        currentY += 18;
      }

      const recipeImage = await loadImageForPdf(recipeForPdf.strMealThumb);
      if (recipeImage) {
        const maxImageHeight = 220;
        const widthScale = contentWidth / recipeImage.width;
        const heightScale = maxImageHeight / recipeImage.height;
        const scale = Math.min(widthScale, heightScale);

        const imageWidth = recipeImage.width * scale;
        const imageHeight = recipeImage.height * scale;
        const imageX = margin + (contentWidth - imageWidth) / 2;

        doc.addImage(
          recipeImage.dataUrl,
          recipeImage.format,
          imageX,
          currentY,
          imageWidth,
          imageHeight,
          undefined,
          'FAST',
        );
        currentY += imageHeight + 18;
      }

      const ensureSpace = (requiredHeight = 20) => {
        if (currentY + requiredHeight <= pageHeight - margin) return;
        doc.addPage();
        currentY = margin;
      };

      ensureSpace(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Ingredients', margin, currentY);
      currentY += 16;

      const ingredientAvatarCache = new Map();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      for (const recipeIngredient of ingredientsForPdf) {
        let avatarImage = ingredientAvatarCache.get(recipeIngredient.thumbnail);
        if (avatarImage === undefined) {
          avatarImage = await loadImageForPdf(recipeIngredient.thumbnail);
          ingredientAvatarCache.set(recipeIngredient.thumbnail, avatarImage);
        }

        const avatarSize = avatarImage ? 12 : 0;
        const linePrefix = avatarImage ? '' : '- ';
        const textX = margin + (avatarImage ? avatarSize + 6 : 0);
        const textWidth = contentWidth - (textX - margin);
        const line = `${linePrefix}${recipeIngredient.ingredient}: ${recipeIngredient.measure}`;
        const wrappedLines = doc.splitTextToSize(line, textWidth);
        const textBlockHeight = wrappedLines.length * 14;
        const rowHeight = Math.max(
          textBlockHeight,
          avatarImage ? avatarSize + 4 : 0,
        );

        ensureSpace(rowHeight + 4);

        if (avatarImage) {
          doc.addImage(
            avatarImage.dataUrl,
            avatarImage.format,
            margin,
            currentY - 10,
            avatarSize,
            avatarSize,
            undefined,
            'FAST',
          );
        }

        doc.text(wrappedLines, textX, currentY);
        currentY += rowHeight + 2;
      }

      if (recipeForPdf.strInstructions) {
        ensureSpace(28);
        currentY += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Instructions', margin, currentY);
        currentY += 16;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const wrappedInstructions = doc.splitTextToSize(
          recipeForPdf.strInstructions,
          contentWidth,
        );

        wrappedInstructions.forEach((line) => {
          ensureSpace(14);
          doc.text(line, margin, currentY);
          currentY += 14;
        });
      }

      const safeName = makeSafeFileName(recipeForPdf.strMeal || 'recipe');
      doc.save(`${safeName}.pdf`);
    };

    const fetchRecipesFromUrl = async (url) => {
      recipesLoading.value = true;
      recipesError.value = '';

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Could not load recipes right now.');
        }

        const data = await response.json();
        recipes.value = normalizeRecipes(data.meals || []);
      } catch (error) {
        recipes.value = [];
        recipesError.value =
          error instanceof Error
            ? error.message
            : 'Could not load recipes right now.';
      } finally {
        recipesLoading.value = false;
      }
    };

    const fetchRecipeDetailsByIds = async (meals = []) => {
      const detailedMeals = await Promise.all(
        meals.map(async (meal) => {
          try {
            const response = await fetch(
              `${mealDbBaseUrl}/lookup.php?i=${encodeURIComponent(meal.idMeal)}`,
            );

            if (!response.ok) return meal;

            const data = await response.json();
            return data.meals?.[0] || meal;
          } catch {
            return meal;
          }
        }),
      );

      return normalizeRecipes(detailedMeals);
    };

    const fetchFilteredRecipes = async (
      queryKey,
      queryValue,
      { includeDetails = true, enrichRecipe = null } = {},
    ) => {
      recipesLoading.value = true;
      recipesError.value = '';

      try {
        const response = await fetch(
          `${mealDbBaseUrl}/filter.php?${queryKey}=${encodeURIComponent(queryValue)}`,
        );
        if (!response.ok) {
          throw new Error('Could not load recipes right now.');
        }

        const data = await response.json();
        const baseRecipes = normalizeRecipes(data.meals || []);

        let nextRecipes = baseRecipes;
        if (includeDetails && baseRecipes.length > 0) {
          nextRecipes = await fetchRecipeDetailsByIds(baseRecipes);
        }

        if (typeof enrichRecipe === 'function') {
          nextRecipes = nextRecipes.map((recipe) => ({
            ...recipe,
            ...enrichRecipe(recipe),
          }));
        }

        recipes.value = normalizeRecipes(nextRecipes);
      } catch (error) {
        recipes.value = [];
        recipesError.value =
          error instanceof Error
            ? error.message
            : 'Could not load recipes right now.';
      } finally {
        recipesLoading.value = false;
      }
    };

    const loadRecipeCategories = async () => {
      try {
        const response = await fetch(`${mealDbBaseUrl}/list.php?c=list`);
        if (!response.ok) throw new Error();

        const data = await response.json();
        recipeCategories.value = data.meals || [];
      } catch {
        recipeCategories.value = [];
      }
    };

    const loadAllRecipes = async () => {
      selectedRecipeLetter.value = 'All';
      selectedRecipeCategory.value = 'All';
      await fetchRecipesFromUrl(
        `${mealDbBaseUrl}/search.php?s=${encodeURIComponent('')}`,
      );
    };

    const searchRecipes = async () => {
      selectedRecipeLetter.value = 'All';
      selectedRecipeCategory.value = 'All';
      await fetchRecipesFromUrl(
        `${mealDbBaseUrl}/search.php?s=${encodeURIComponent(recipeSearchQuery.value.trim())}`,
      );
    };

    const filterRecipesByLetter = async (letter) => {
      selectedRecipeLetter.value = letter;
      selectedRecipeCategory.value = 'All';
      recipeSearchQuery.value = '';
      await fetchRecipesFromUrl(
        `${mealDbBaseUrl}/search.php?f=${encodeURIComponent(letter.toLowerCase())}`,
      );
    };

    const filterRecipesByCategory = async (category) => {
      selectedRecipeCategory.value = category;
      selectedRecipeLetter.value = 'All';
      recipeSearchQuery.value = '';
      recipes.value = [];

      if (category === 'All') {
        await loadAllRecipes();
        return;
      }

      await fetchFilteredRecipes('c', category, {
        includeDetails: false,
        enrichRecipe: () => ({ strCategory: category }),
      });
    };

    const onRecipeSearchInput = () => {
      if (recipeSearchTimeoutId) {
        clearTimeout(recipeSearchTimeoutId);
      }

      recipeSearchTimeoutId = setTimeout(() => {
        searchRecipes();
      }, 300);
    };

    const openRecipeModal = async (recipe) => {
      recipeModalLoading.value = true;
      isRecipeModalOpen.value = true;
      recipesError.value = '';

      try {
        const response = await fetch(
          `${mealDbBaseUrl}/lookup.php?i=${encodeURIComponent(recipe.idMeal)}`,
        );
        if (!response.ok) {
          throw new Error('Could not load recipe details right now.');
        }

        const data = await response.json();
        selectedRecipe.value = data.meals?.[0] || recipe;
      } catch (error) {
        selectedRecipe.value = recipe;
        recipesError.value =
          error instanceof Error
            ? error.message
            : 'Could not load recipe details right now.';
      } finally {
        recipeModalLoading.value = false;
      }
    };

    const closeRecipeModal = () => {
      isRecipeModalOpen.value = false;
      selectedRecipe.value = null;
      recipeModalLoading.value = false;
    };

    const recipeIngredients = computed(() => {
      if (!selectedRecipe.value) return [];

      return Array.from({ length: 20 }, (_, index) => index + 1)
        .map((ingredientIndex) => {
          const ingredient =
            selectedRecipe.value[`strIngredient${ingredientIndex}`]?.trim();
          const measure =
            selectedRecipe.value[`strMeasure${ingredientIndex}`]?.trim();

          if (!ingredient) return null;

          return {
            ingredient,
            measure: measure || 'As needed',
            thumbnail: `https://www.themealdb.com/images/ingredients/${ingredient.replace(/\s+/g, '_')}-small.png`,
          };
        })
        .filter(Boolean);
    });

    const recipeLinks = computed(() => {
      if (!selectedRecipe.value) return [];

      return [
        selectedRecipe.value.strSource
          ? {
              href: selectedRecipe.value.strSource,
              label: 'Source',
              icon: 'open_in_new',
            }
          : null,
        selectedRecipe.value.strYoutube
          ? {
              href: selectedRecipe.value.strYoutube,
              label: 'YouTube',
              icon: 'smart_display',
            }
          : null,
      ].filter(Boolean);
    });

    const isRecipeFavoriteItem = (item) =>
      item.isSaved && (item.favoriteSource === 'recipe' || !!item.recipeMeta);

    const isFoodFactFavoriteItem = (item) =>
      item.isSaved &&
      (item.favoriteSource === 'food-fact' || !!item.foodFactMeta);

    const favoriteCartTemplatesByGroup = computed(() => {
      const grouped = {};
      const sorted = [...(cartStore.cartItems || [])]
        .filter(
          (item) =>
            item.isSaved &&
            !isRecipeFavoriteItem(item) &&
            !isFoodFactFavoriteItem(item),
        )
        .sort((a, b) => a.title.localeCompare(b.title));

      sorted.forEach((item) => {
        const groupName = item.group || 'General';
        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push(item);
      });

      return grouped;
    });

    const favoriteRecipeTemplates = computed(() => {
      const byRecipe = new Map();

      (cartStore.cartItems || [])
        .filter((item) => isRecipeFavoriteItem(item))
        .forEach((item) => {
          const meta = item.recipeMeta || {};
          const recipeKey = meta.idMeal || `group:${item.group || 'Recipes'}`;

          if (!byRecipe.has(recipeKey)) {
            byRecipe.set(recipeKey, {
              key: recipeKey,
              idMeal: meta.idMeal || null,
              strMeal: meta.strMeal || item.group || 'Recipe Template',
              strCategory: meta.strCategory || 'Recipe',
              strArea: meta.strArea || '',
              strMealThumb: meta.strMealThumb || '',
              strSource: meta.strSource || '',
              strYoutube: meta.strYoutube || '',
              strInstructions: meta.strInstructions || '',
              items: [],
            });
          }

          byRecipe.get(recipeKey).items.push(item);
        });

      return [...byRecipe.values()]
        .map((recipe) => {
          const itemList = [...recipe.items].sort(
            (first, second) => (first.order ?? 0) - (second.order ?? 0),
          );
          const normalizedRecipe = { ...recipe };

          itemList.slice(0, 20).forEach((item, index) => {
            normalizedRecipe[`strIngredient${index + 1}`] = item.title;
            normalizedRecipe[`strMeasure${index + 1}`] =
              `${item.amount} ${item.unit}`;
          });

          return normalizedRecipe;
        })
        .sort((firstRecipe, secondRecipe) =>
          firstRecipe.strMeal.localeCompare(secondRecipe.strMeal),
        );
    });

    const favoriteCartTemplateCount = computed(
      () => Object.keys(favoriteCartTemplatesByGroup.value).length,
    );

    const favoriteRecipeTemplateCount = computed(
      () => favoriteRecipeTemplates.value.length,
    );

    const favoriteFoodFactTemplates = computed(() => {
      const byFoodFact = new Map();

      (cartStore.cartItems || [])
        .filter((item) => isFoodFactFavoriteItem(item))
        .forEach((item) => {
          const meta = item.foodFactMeta || {};
          const foodFactKey =
            meta.key || `${meta.fdcId || 'no-id'}:${item.title || 'Food Fact'}`;

          if (!byFoodFact.has(foodFactKey)) {
            byFoodFact.set(foodFactKey, {
              key: foodFactKey,
              title: meta.description || item.title || 'Food Fact',
              nutrients: {
                calories: Number.isFinite(Number(meta?.nutrients?.calories))
                  ? Number(meta.nutrients.calories).toFixed(1)
                  : '-',
                protein: Number.isFinite(Number(meta?.nutrients?.protein))
                  ? `${Number(meta.nutrients.protein).toFixed(1)} g`
                  : '-',
                carbs: Number.isFinite(Number(meta?.nutrients?.carbs))
                  ? `${Number(meta.nutrients.carbs).toFixed(1)} g`
                  : '-',
                fat: Number.isFinite(Number(meta?.nutrients?.fat))
                  ? `${Number(meta.nutrients.fat).toFixed(1)} g`
                  : '-',
                fiber: Number.isFinite(Number(meta?.nutrients?.fiber))
                  ? `${Number(meta.nutrients.fiber).toFixed(1)} g`
                  : '-',
              },
            });
          }
        });

      return [...byFoodFact.values()].sort((first, second) =>
        first.title.localeCompare(second.title),
      );
    });

    const favoriteFoodFactTemplateCount = computed(
      () => favoriteFoodFactTemplates.value.length,
    );

    const savedFoodFactKeys = computed(() =>
      favoriteFoodFactTemplates.value.map((foodFact) => foodFact.key),
    );

    const favoriteTemplateCount = computed(
      () =>
        Object.keys(savedByGroup.value || {}).length +
        (cartStore.savedPlaces?.length || 0),
    );

    const canDownloadCartPdf = computed(() =>
      Object.values(itemsByGroup.value || {}).some(
        (groupItems) => (groupItems || []).length > 0,
      ),
    );

    const parseRecipeMeasure = (measureText = '') => {
      const normalizedMeasure = measureText.trim();
      if (!normalizedMeasure) {
        return { amount: 1, unit: 'pieces' };
      }

      const parts = normalizedMeasure.split(/\s+/);
      const amountPart = parts[0]?.replace(',', '.');
      const parsedAmount = Number(amountPart);
      const unitPart = parts[1]?.toLowerCase().replace(/[^a-z]/g, '') || '';

      const mappedUnit = supportedRecipeUnits[unitPart] || 'pieces';
      const normalizedAmount =
        Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 1;

      return {
        amount:
          mappedUnit === 'pieces' ||
          mappedUnit === 'gram' ||
          mappedUnit === 'milliliter'
            ? Math.max(1, Math.round(normalizedAmount))
            : Number(normalizedAmount.toFixed(2)),
        unit: mappedUnit,
      };
    };

    const buildRecipeMeta = (recipe) => ({
      idMeal: recipe?.idMeal || null,
      strMeal: recipe?.strMeal || 'Recipe Template',
      strCategory: recipe?.strCategory || 'Recipe',
      strArea: recipe?.strArea || '',
      strMealThumb: recipe?.strMealThumb || '',
      strSource: recipe?.strSource || '',
      strYoutube: recipe?.strYoutube || '',
      strInstructions: recipe?.strInstructions || '',
    });

    const saveRecipeFromCard = async (recipe) => {
      if (!recipe) return;

      let recipeToSave = recipe;
      let ingredients = toRecipeIngredients(recipeToSave);

      if (ingredients.length === 0 && recipe.idMeal) {
        try {
          const response = await fetch(
            `${mealDbBaseUrl}/lookup.php?i=${encodeURIComponent(recipe.idMeal)}`,
          );
          if (response.ok) {
            const data = await response.json();
            const fullRecipe = data.meals?.[0];
            if (fullRecipe) {
              recipeToSave = fullRecipe;
              ingredients = toRecipeIngredients(recipeToSave);
            }
          }
        } catch {
          // Save uses best-effort enrichment; keep silent if detail fetch fails.
        }
      }

      if (!ingredients.length) {
        cartStore.showToast(
          'Could not read recipe ingredients. Open details and try again.',
          'warning',
        );
        return;
      }

      const recipeMeta = buildRecipeMeta(recipeToSave);

      cartStore.addItemsToFavorites(
        ingredients.map((recipeIngredient) => {
          const parsedMeasure = parseRecipeMeasure(recipeIngredient.measure);

          return {
            title: recipeIngredient.ingredient,
            amount: parsedMeasure.amount,
            unit: parsedMeasure.unit,
          };
        }),
        recipeToSave.strMeal || 'Recipes',
        {
          sourceType: 'recipe',
          recipeMeta,
        },
      );
    };

    const addRecipeToFavorites = () => {
      if (!selectedRecipe.value || !recipeIngredients.value.length) return;

      const recipeMeta = buildRecipeMeta(selectedRecipe.value);

      cartStore.addItemsToFavorites(
        recipeIngredients.value.map((recipeIngredient) => {
          const parsedMeasure = parseRecipeMeasure(recipeIngredient.measure);

          return {
            title: recipeIngredient.ingredient,
            amount: parsedMeasure.amount,
            unit: parsedMeasure.unit,
          };
        }),
        selectedRecipe.value.strMeal || 'Recipes',
        {
          sourceType: 'recipe',
          recipeMeta,
        },
      );

      closeRecipeModal();
    };

    const addRecipeIngredientToFavorites = (recipeIngredient) => {
      if (!selectedRecipe.value) return;

      const parsedMeasure = parseRecipeMeasure(recipeIngredient.measure);
      const recipeMeta = buildRecipeMeta(selectedRecipe.value);

      cartStore.addItemsToFavorites(
        [
          {
            title: recipeIngredient.ingredient,
            amount: parsedMeasure.amount,
            unit: parsedMeasure.unit,
          },
        ],
        selectedRecipe.value.strMeal || 'Recipes',
        {
          sourceType: 'recipe',
          recipeMeta,
        },
      );
    };

    const saveFoodFactTemplate = (foodFact) => {
      if (!foodFact?.description) return;

      const key = `${foodFact.fdcId ?? 'no-id'}:${foodFact.description}`;
      const nutrients = extractCoreNutrients(foodFact);

      cartStore.addItemsToFavorites(
        [
          {
            title: foodFact.description,
            amount: 1,
            unit: 'entry',
          },
        ],
        'Food Facts',
        {
          sourceType: 'food-fact',
          foodFactMeta: {
            key,
            fdcId: foodFact.fdcId ?? null,
            description: foodFact.description,
            nutrients,
          },
        },
      );
    };

    const downloadGroupedItemsPdf = async ({
      title,
      fileName,
      groupedItems,
      groupItemNoun,
      showAvatarTitle = false,
      titleAvatarUrl = '',
      includeTotals = false,
      numberGroups = false,
    }) => {
      const groupEntries = Object.entries(groupedItems || {}).filter(
        ([, groupItems]) => (groupItems || []).length > 0,
      );
      if (groupEntries.length === 0) return;

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      const ensureSpace = (requiredHeight = 20) => {
        if (currentY + requiredHeight <= pageHeight - margin) return;
        doc.addPage();
        currentY = margin;
      };

      const totalItemCount = groupEntries.reduce(
        (count, [, groupItems]) => count + groupItems.length,
        0,
      );
      const titleAvatarImage =
        showAvatarTitle && titleAvatarUrl
          ? await loadImageForPdf(titleAvatarUrl)
          : null;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);

      if (showAvatarTitle) {
        const avatarSize = 20;
        const titleX = margin + avatarSize + 8;

        if (titleAvatarImage) {
          doc.addImage(
            titleAvatarImage.dataUrl,
            titleAvatarImage.format,
            margin,
            currentY - avatarSize + 1,
            avatarSize,
            avatarSize,
            undefined,
            'FAST',
          );
        }

        doc.text(title, titleX, currentY);
      } else {
        doc.text(title, margin, currentY);
      }

      currentY += 22;

      if (includeTotals) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Total shops: ${groupEntries.length}`, margin, currentY);
        currentY += 14;
        doc.text(`Total items: ${totalItemCount}`, margin, currentY);
        currentY += 16;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, currentY);
      currentY += 20;

      groupEntries.forEach(([groupName, groupItems], groupIndex) => {
        ensureSpace(28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);

        const groupPrefix = numberGroups ? `${groupIndex + 1}- ` : '';
        doc.text(
          `${groupPrefix}${groupName} (${groupItems.length} ${groupItems.length === 1 ? groupItemNoun : `${groupItemNoun}s`})`,
          margin,
          currentY,
        );
        currentY += 16;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        groupItems.forEach((item) => {
          const line = `- ${item.title}: ${item.amount} ${item.unit || 'pieces'}`;
          const wrapped = doc.splitTextToSize(line, contentWidth);
          ensureSpace(wrapped.length * 14 + 4);
          doc.text(wrapped, margin, currentY);
          currentY += wrapped.length * 14;
        });

        currentY += 10;
      });

      doc.save(`${makeSafeFileName(fileName)}.pdf`);
    };

    const downloadCartPdf = async () => {
      await downloadGroupedItemsPdf({
        title: 'Cart',
        fileName: 'cart',
        groupedItems: itemsByGroup.value,
        groupItemNoun: 'item',
        showAvatarTitle: true,
        titleAvatarUrl: '/cart-icon.svg',
        includeTotals: true,
        numberGroups: true,
      });
    };

    const downloadFavoriteCartTemplateGroupPdf = async (groupName) => {
      const groupItems = favoriteCartTemplatesByGroup.value?.[groupName] || [];
      if (!groupItems.length) return;

      await downloadGroupedItemsPdf({
        title: `Saved Shopping list - ${groupName}`,
        fileName: `saved-cart-${groupName}`,
        groupedItems: {
          [groupName]: groupItems,
        },
        groupItemNoun: 'saved item',
      });
    };

    const openFavoriteRecipeModal = (recipeTemplate) => {
      selectedRecipe.value = recipeTemplate;
      recipesError.value = '';
      recipeModalLoading.value = false;
      isRecipeModalOpen.value = true;
    };

    const onRecipeSearchSubmit = () => {
      searchRecipes();
    };

    const resetRecipeSearch = () => {
      recipeSearchQuery.value = '';
      loadAllRecipes();
    };

    const onRecipesClick = async () => {
      filter.value = 'Recipes';
      if (!recipes.value.length && !recipesLoading.value) {
        await loadAllRecipes();
      }
    };

    const openFoodFacts = () => {
      filter.value = 'FoodFacts';
    };

    const openNearbyShops = () => {
      filter.value = 'PlaceFinder';
    };

    const openNearbyRestaurants = () => {
      filter.value = 'PlaceFinder';
    };

    const openPlaceFinder = () => {
      filter.value = 'PlaceFinder';
    };

    // drag state
    const draggedId = ref(null);
    const dragOverId = ref(null);
    const dragOverGroup = ref(null);

    const {
      cartItems,
      isLoading,
      savedItems,
      totalCount,
      savedCount,
      itemsByGroup,
      groups,
      savedByGroup,
      toast,
    } = storeToRefs(cartStore);

    onMounted(() => {
      themeStore.loadTheme();
      cartStore.loadCartItems();
      updateCopyrightYear();
      loadRecipeCategories();
      yearIntervalId = setInterval(updateCopyrightYear, 60 * 60 * 1000);
      setTimeout(() => {
        showSplash.value = false;
      }, 3000);
    });

    onUnmounted(() => {
      if (yearIntervalId) {
        clearInterval(yearIntervalId);
      }

      if (recipeSearchTimeoutId) {
        clearTimeout(recipeSearchTimeoutId);
      }
    });

    // --- Drag-and-drop items ---
    const onDragStart = (item) => {
      draggedId.value = item._id;
    };

    const onDragOver = (item) => {
      if (item._id !== draggedId.value) {
        dragOverId.value = item._id;
      }
    };

    const onDragLeave = () => {
      dragOverId.value = null;
    };

    const onDrop = (targetItem, groupName) => {
      dragOverId.value = null;
      if (!draggedId.value || draggedId.value === targetItem._id) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged) return;

      const draggedFromGroup = dragged.group || 'General';
      const targetGroup = groupName;

      if (draggedFromGroup !== targetGroup) {
        if (cartStore.itemExistsInGroup(dragged.title, targetGroup)) {
          cartStore.showToast(
            `"${dragged.title}" already exists in shop "${targetGroup}". Delete it there, and edit its amount/unit in that shop instead.`,
            'warning',
          );
          draggedId.value = null;
          return;
        }
        cartStore.moveItemToGroup(draggedId.value, targetGroup);
      }

      const groupItems = allItems
        .filter(
          (i) =>
            (i._id === draggedId.value ? targetGroup : i.group || 'General') ===
            targetGroup,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const fromIndex = groupItems.findIndex((i) => i._id === draggedId.value);
      const toIndex = groupItems.findIndex((i) => i._id === targetItem._id);

      if (fromIndex !== -1 && toIndex !== -1) {
        const reordered = [...groupItems];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, dragged);
        const updates = reordered.map((item, idx) => ({
          id: item._id,
          order: idx,
        }));
        cartStore.reorderItems(updates);
      }

      draggedId.value = null;
    };

    const onDropOnGroup = (groupName) => {
      dragOverGroup.value = null;
      if (!draggedId.value) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged) return;

      const draggedFromGroup = dragged.group || 'General';
      if (draggedFromGroup !== groupName) {
        if (cartStore.itemExistsInGroup(dragged.title, groupName)) {
          cartStore.showToast(
            `"${dragged.title}" already exists in shop "${groupName}". Delete it there, or edit its amount/unit in that shop instead.`,
            'warning',
          );
          draggedId.value = null;
          return;
        }
        cartStore.moveItemToGroup(draggedId.value, groupName);
      }

      const groupItems = allItems
        .filter(
          (i) =>
            (i.group || 'General') === groupName && i._id !== draggedId.value,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const maxOrder = groupItems.length;
      dragged.order = maxOrder;
      const updates = [...groupItems, dragged].map((item, idx) => ({
        id: item._id,
        order: idx,
      }));
      cartStore.reorderItems(updates);

      draggedId.value = null;
    };

    const onDropSaved = (targetItem, groupName) => {
      dragOverId.value = null;
      if (!draggedId.value || draggedId.value === targetItem._id) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged || !dragged.isSaved) return;

      const draggedFromGroup = dragged.group || 'General';
      const targetGroup = groupName;

      if (draggedFromGroup !== targetGroup) {
        cartStore.moveItemToGroup(draggedId.value, targetGroup);
      }

      const groupItems = allItems
        .filter(
          (i) =>
            i.isSaved &&
            (i._id === draggedId.value ? targetGroup : i.group || 'General') ===
              targetGroup,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const fromIndex = groupItems.findIndex((i) => i._id === draggedId.value);
      const toIndex = groupItems.findIndex((i) => i._id === targetItem._id);

      if (fromIndex !== -1 && toIndex !== -1) {
        const reordered = [...groupItems];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, dragged);
        const updates = reordered.map((item, idx) => ({
          id: item._id,
          order: idx,
        }));
        cartStore.reorderItems(updates);
      }

      draggedId.value = null;
    };

    const onDropOnSavedGroup = (groupName) => {
      dragOverGroup.value = null;
      if (!draggedId.value) return;

      const allItems = cartStore.cartItems;
      const dragged = allItems.find((i) => i._id === draggedId.value);
      if (!dragged || !dragged.isSaved) return;

      const draggedFromGroup = dragged.group || 'General';
      if (draggedFromGroup !== groupName) {
        cartStore.moveItemToGroup(draggedId.value, groupName);
      }

      const groupItems = allItems
        .filter(
          (i) =>
            i.isSaved &&
            (i.group || 'General') === groupName &&
            i._id !== draggedId.value,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const maxOrder = groupItems.length;
      dragged.order = maxOrder;
      const updates = [...groupItems, dragged].map((item, idx) => ({
        id: item._id,
        order: idx,
      }));
      cartStore.reorderItems(updates);

      draggedId.value = null;
    };

    const onDragEnd = () => {
      draggedId.value = null;
      dragOverId.value = null;
      dragOverGroup.value = null;
    };

    // --- Drag-and-drop groups ---
    const onGroupDragLeave = () => {
      dragOverGroup.value = null;
    };

    const groupDeleteDialog = ref({
      open: false,
      groupName: '',
      isFavoriteGroup: false,
    });

    const templateDeleteDialog = ref({
      open: false,
      templateType: 'recipe',
      templateKey: '',
      templateLabel: '',
    });

    // Group rename
    const editingGroup = ref(null);
    const editGroupName = ref('');

    const startGroupEdit = (groupName) => {
      editingGroup.value = groupName;
      editGroupName.value = groupName;
    };

    const cancelGroupEdit = () => {
      editingGroup.value = null;
      editGroupName.value = '';
    };

    const saveGroupEdit = (oldName, isFavoriteGroup = false) => {
      const newName = editGroupName.value.trim();
      if (newName && newName !== oldName) {
        if (isFavoriteGroup) {
          cartStore.renameSavedGroup(oldName, newName);
        } else {
          cartStore.renameGroup(oldName, newName);
        }
      }
      editingGroup.value = null;
      editGroupName.value = '';
    };

    const groupDeleteTitle = computed(() => 'Delete shop');

    const groupDeleteMessage = computed(
      () =>
        `Are you sure you want to delete shop "${groupDeleteDialog.value.groupName}" and its items?`,
    );

    const requestGroupDelete = (groupName, isFavoriteGroup = false) => {
      groupDeleteDialog.value = {
        open: true,
        groupName,
        isFavoriteGroup,
      };
    };

    const cancelGroupDelete = () => {
      groupDeleteDialog.value.open = false;
    };

    const confirmGroupDelete = () => {
      const { groupName, isFavoriteGroup } = groupDeleteDialog.value;
      if (isFavoriteGroup) {
        cartStore.deleteSavedGroup(groupName);
      } else {
        cartStore.deleteGroup(groupName);
      }
      groupDeleteDialog.value.open = false;
    };

    const templateDeleteTitle = computed(() => 'Remove saved template');

    const templateDeleteMessage = computed(() => {
      const targetLabel =
        templateDeleteDialog.value.templateLabel || 'this template';
      return `Are you sure you want to remove saved template "${targetLabel}"?`;
    });

    const requestRecipeTemplateDelete = (favoriteRecipe) => {
      templateDeleteDialog.value = {
        open: true,
        templateType: 'recipe',
        templateKey: favoriteRecipe?.key || '',
        templateLabel: favoriteRecipe?.strMeal || 'Recipe template',
      };
    };

    const requestFoodFactTemplateDelete = (favoriteFoodFact) => {
      templateDeleteDialog.value = {
        open: true,
        templateType: 'food-fact',
        templateKey: favoriteFoodFact?.key || '',
        templateLabel: favoriteFoodFact?.title || 'Food fact template',
      };
    };

    const cancelTemplateDelete = () => {
      templateDeleteDialog.value.open = false;
    };

    const confirmTemplateDelete = () => {
      const { templateType, templateKey } = templateDeleteDialog.value;
      if (!templateKey) {
        templateDeleteDialog.value.open = false;
        return;
      }

      if (templateType === 'food-fact') {
        cartStore.deleteFavoriteFoodFactTemplate(templateKey);
      } else {
        cartStore.deleteFavoriteRecipeTemplate(templateKey);
      }

      templateDeleteDialog.value.open = false;
    };

    const addGroupToFavorites = (groupName) => {
      cartStore.saveGroupAsFavorites(groupName);
    };

    return {
      cartStore,
      themeStore,
      showSplash,
      copyrightYear,
      updateCopyrightYear,
      filter,
      cartItems,
      isLoading,
      savedItems,
      totalCount,
      savedCount,
      itemsByGroup,
      groups,
      savedByGroup,
      toast,
      recipeLetters,
      recipeSearchQuery,
      selectedRecipeLetter,
      selectedRecipeCategory,
      recipeCategories,
      recipes,
      recipesLoading,
      recipesError,
      favoritesTemplateFilter,
      isRecipeFiltersOpen,
      favoriteCartTemplatesByGroup,
      favoriteRecipeTemplates,
      favoriteFoodFactTemplates,
      favoriteCartTemplateCount,
      favoriteRecipeTemplateCount,
      favoriteFoodFactTemplateCount,
      favoriteTemplateCount,
      savedFoodFactKeys,
      selectedRecipe,
      isRecipeModalOpen,
      recipeModalLoading,
      recipeIngredients,
      recipeLinks,
      canDownloadCartPdf,
      draggedId,
      dragOverId,
      dragOverGroup,
      groupDeleteDialog,
      templateDeleteDialog,
      groupDeleteTitle,
      groupDeleteMessage,
      templateDeleteTitle,
      templateDeleteMessage,
      editingGroup,
      editGroupName,
      onDragStart,
      onDragOver,
      onDragLeave,
      onDrop,
      onDropSaved,
      onDropOnSavedGroup,
      onDropOnGroup,
      onDragEnd,
      onGroupDragLeave,
      requestGroupDelete,
      cancelGroupDelete,
      confirmGroupDelete,
      cancelTemplateDelete,
      confirmTemplateDelete,
      requestRecipeTemplateDelete,
      requestFoodFactTemplateDelete,
      saveFoodFactTemplate,
      addGroupToFavorites,
      onRecipesClick,
      openFoodFacts,
      openNearbyShops,
      openNearbyRestaurants,
      openPlaceFinder,
      onRecipeSearchSubmit,
      onRecipeSearchInput,
      resetRecipeSearch,
      filterRecipesByLetter,
      filterRecipesByCategory,
      openRecipeModal,
      openFavoriteRecipeModal,
      closeRecipeModal,
      downloadRecipePdf,
      downloadCartPdf,
      downloadFavoriteCartTemplateGroupPdf,
      addRecipeIngredientToFavorites,
      addRecipeToFavorites,
      saveRecipeFromCard,
      startGroupEdit,
      cancelGroupEdit,
      saveGroupEdit,
    };
  },
};
</script>

<template>
  <main>
    <!-- Splash Screen -->
    <transition name="splash-fade">
      <div v-if="showSplash" class="splash-screen">
        <div class="splash-content">
          <div class="splash-icon">
            <img
              src="../assets/pinit-down.png"
              alt="Pinit Down"
              class="splash-logo"
            />
          </div>
          <div class="splash-divider">
          <h1 class="splash-title">Pinit Down</h1>
          <p class="splash-description">
            Your shopping lists, recipes, food facts &amp; saved places — all in one place.
          </p>
          <div class="splash-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="!showSplash" class="app-layout">
      <AppHeader
        :isDark="themeStore.isDark"
        :filter="filter"
        :savedCount="favoriteTemplateCount"
        @toggle-theme="themeStore.toggleTheme()"
        @update:filter="filter = $event"
        @open-recipes="onRecipesClick"
        @open-food-facts="openFoodFacts"
        @open-nearby-shops="openNearbyShops"
        @open-nearby-restaurants="openNearbyRestaurants"
        @open-place-finder="openPlaceFinder"
      />
      <div v-if="filter === 'All'" class="user-welcome">
        <div class="welcome-content">
          <p>Your personal cart dashboard</p>
          <div class="user-stats">
            <span class="stat"
              >{{ groups.length }}
              {{ groups.length <= 1 ? 'shop' : 'shops' }}
            </span>
            <span class="stat"
              >{{ totalCount }}
              {{ totalCount <= 1 ? 'item' : 'items' }}
            </span>
          </div>
        </div>
      </div>
      <div class="container-wrapper">
        <div class="container">
          <div class="groups-scroll-area">
            <div v-if="filter === 'All'">
              <CartBoardPanel
                :cart-store="cartStore"
                :can-download-cart-pdf="canDownloadCartPdf"
                :total-count="totalCount"
                :groups="groups"
                :items-by-group="itemsByGroup"
                :dragged-id="draggedId"
                :drag-over-id="dragOverId"
                :editing-group="editingGroup"
                :edit-group-name="editGroupName"
                @download-cart-pdf="downloadCartPdf"
                @group-drag-leave="onGroupDragLeave"
                @set-drag-over-group="dragOverGroup = $event"
                @drop-on-group="onDropOnGroup"
                @drag-end="onDragEnd"
                @update-edit-group-name="editGroupName = $event"
                @save-group-edit="saveGroupEdit"
                @cancel-group-edit="cancelGroupEdit"
                @start-group-edit="startGroupEdit"
                @add-group-to-favorites="addGroupToFavorites"
                @request-group-delete="requestGroupDelete($event, false)"
                @drag-start="onDragStart"
                @drag-over="onDragOver"
                @drag-leave="onDragLeave"
                @drop-item="onDrop"
              />
            </div>

            <!-- Favorite items grouped -->
            <div v-if="filter === 'Favs'">
              <FavoritesTemplatesPanel
                :template-filter="favoritesTemplateFilter"
                :favorite-cart-template-count="favoriteCartTemplateCount"
                :favorite-recipe-template-count="favoriteRecipeTemplateCount"
                :favorite-food-fact-template-count="
                  favoriteFoodFactTemplateCount
                "
                :favorite-cart-templates-by-group="favoriteCartTemplatesByGroup"
                :favorite-recipe-templates="favoriteRecipeTemplates"
                :favorite-food-fact-templates="favoriteFoodFactTemplates"
                :saved-count="savedCount"
                :saved-places="cartStore.savedPlaces"
                @update:template-filter="favoritesTemplateFilter = $event"
                @open-favorite-recipe="openFavoriteRecipeModal"
                @download-recipe="downloadRecipePdf"
                @download-group-pdf="downloadFavoriteCartTemplateGroupPdf"
                @delete-favorite-group="requestGroupDelete($event, true)"
                @delete-favorite-recipe="requestRecipeTemplateDelete"
                @delete-favorite-food-fact="requestFoodFactTemplateDelete"
                @delete-saved-place="cartStore.deleteSavedPlace($event.id)"
              />
            </div>

            <div v-if="filter === 'Recipes'" class="recipes-view">
              <RecipesToolbar
                :is-recipe-filters-open="isRecipeFiltersOpen"
                :recipe-search-query="recipeSearchQuery"
                :selected-recipe-category="selectedRecipeCategory"
                :recipe-categories="recipeCategories"
                :selected-recipe-letter="selectedRecipeLetter"
                :recipe-letters="recipeLetters"
                @update-filters-open="isRecipeFiltersOpen = $event"
                @update-recipe-search-query="recipeSearchQuery = $event"
                @submit-recipe-search="onRecipeSearchSubmit"
                @recipe-search-input="onRecipeSearchInput"
                @filter-by-category="filterRecipesByCategory"
                @reset-recipes="resetRecipeSearch"
                @filter-by-letter="filterRecipesByLetter"
              />

              <p class="recipes-hint">
                Browse all recipes, search by name, or jump by first letter.
                Open <strong>See details</strong> to view ingredients,
                instructions, the recipe on its source website, and the YouTube
                video. You can also save the recipe for later use or even Download it as a PDF.
              </p>

              <p v-if="recipesLoading" class="empty-state">
                Loading recipes...
              </p>
              <p v-else-if="recipesError" class="empty-state recipes-error">
                {{ recipesError }}
              </p>
              <p v-else-if="recipes.length === 0" class="empty-state">
                No recipes found for this search.
              </p>

              <div v-else class="recipes-grid">
                <RecipeCard
                  v-for="recipe in recipes"
                  :key="recipe.idMeal"
                  :recipe="recipe"
                  @open-details="openRecipeModal"
                  @save-recipe="saveRecipeFromCard"
                  @download-recipe="downloadRecipePdf"
                />
              </div>
            </div>

            <div v-if="filter === 'FoodFacts'" class="recipes-view">
              <FoodFactsPanel
                :saved-food-fact-keys="savedFoodFactKeys"
                @save-food-fact="saveFoodFactTemplate"
              />
            </div>

            <div v-if="filter === 'PlaceFinder'" class="recipes-view">
              <NearbyPlacesView />
            </div>

          </div>
            <AppFooter :year="copyrightYear" />

        </div>
      </div>

      <div
        v-if="toast.visible"
        class="app-toast"
        :class="`toast-${toast.kind}`"
        @click="cartStore.dismissToast()"
      >
        {{ toast.message }}
      </div>

      <ConfirmDialog
        :open="groupDeleteDialog.open"
        :title="groupDeleteTitle"
        :message="groupDeleteMessage"
        confirm-text="Delete"
        cancel-text="Keep"
        @confirm="confirmGroupDelete"
        @cancel="cancelGroupDelete"
      />

      <ConfirmDialog
        :open="templateDeleteDialog.open"
        :title="templateDeleteTitle"
        :message="templateDeleteMessage"
        confirm-text="Delete"
        cancel-text="Keep"
        @confirm="confirmTemplateDelete"
        @cancel="cancelTemplateDelete"
      />

      <RecipeDetailsModal
        :open="isRecipeModalOpen"
        :loading="recipeModalLoading"
        :recipe="selectedRecipe"
        :recipe-ingredients="recipeIngredients"
        :recipe-links="recipeLinks"
        @close="closeRecipeModal"
        @save-recipe="addRecipeToFavorites"
        @download-recipe="downloadRecipePdf"
        @save-ingredient="addRecipeIngredientToFavorites"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts/breakpoint';
@use '@/styles/abstracts/color';
@use '@/styles/abstracts/spacing';
@use '@/styles/abstracts/size';
@use '@/styles/abstracts/typography';

main {
  height: 100vh;
  overflow: hidden;
}

.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: inherit;
}

.user-welcome {
  position: fixed;
  width: 100%;
  background: color.$gradient;
  color: color.$light;
  padding-top: spacing.$spacing-m;
  z-index: 99;

  .welcome-content {
    display: inline-flex;
    margin: 0 auto;
    text-align: center;
    padding: spacing.$spacing-s * 1.1 spacing.$spacing-xs spacing.$spacing-base
      spacing.$spacing-xs;
    gap: spacing.$spacing-m;
    width: 100%;
    align-items: center;
    justify-content: center;

    @include breakpoint.media-breakpoint-up(sm) {
      padding: spacing.$spacing-2-xl * 0.9 0 spacing.$spacing-base 0;
    }
  }

  .welcome-content h2 {
    @include typography.headline-200-medium;
    margin-bottom: spacing.$spacing-xxs;

    @include breakpoint.media-breakpoint-up(sm) {
      margin-bottom: spacing.$spacing-xs;
    }
  }

  .welcome-content p {
    @include typography.headline-100;
    opacity: 0.9;
  }

  .user-stats {
    display: flex;
    justify-content: center;
    gap: spacing.$spacing-xxs;

    .stat {
      @include typography.headline-100;
      font-weight: 500;
      opacity: 0.95;
      border: size.$sp02 solid rgba(color.$light, 0.4);
      border-radius: size.$sp10;
      background: rgba(color.$light, 0.1);
      padding: spacing.$spacing-base * 0.75;

      @include breakpoint.media-breakpoint-up(sm) {
        padding: spacing.$spacing-base;
      }
    }
  }
  @include breakpoint.media-breakpoint-up(sm) {
    border-radius: size.$sp12;
    padding: spacing.$spacing-base;
  }
}

.container-wrapper {
  max-width: size.$sp-max-desktop;
  padding: spacing.$spacing-l spacing.$spacing-xxs 0 spacing.$spacing-xxs;
  margin: auto;
  width: 100%;
  flex: 1;
  overflow: hidden;

  @include breakpoint.media-breakpoint-up(sm) {
    padding-top: calc(spacing.$spacing-xl + spacing.$spacing-s);
  }

  .container {
    max-width: calc(spacing.$spacing-xl * 10);
    margin: auto;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

.groups-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: spacing.$spacing-xs;

  @include breakpoint.media-breakpoint-up(sm) {
    padding-top: spacing.$spacing-xxs;
  }
}

.recipes-view {
  display: flex;
  flex-direction: column;
  min-width: 0;

  @include breakpoint.media-breakpoint-up(sm) {
    gap: spacing.$spacing-s;
  }
}

.recipes-hint {
  margin: 0;
  color: color.$muted;
  @include typography.headline-120;
  text-align: center;
  padding-bottom: spacing.$spacing-xs;
}

.recipes-error {
  color: color.$danger-text;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: spacing.$spacing-s;

  @include breakpoint.media-breakpoint-up(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include breakpoint.media-breakpoint-up(lg) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

html.dark .recipes-hint {
  color: color.$light50;
}

.app-toast {
  position: fixed;
  left: 50%;
  bottom: spacing.$spacing-xl;
  transform: translateX(-50%);
  z-index: 120;
  padding: spacing.$spacing-xs spacing.$spacing-s;
  border-radius: size.$sp08;
  @include typography.headline-140;
  color: color.$white;
  box-shadow: 0 size.$sp02 size.$sp20 rgba(color.$dark, 0.35);
  cursor: pointer;
  text-align: center;
  max-width: calc(100% - spacing.$spacing-m);
}

.toast-info {
  background: rgba(color.$blue-violet, 0.95);
}

.toast-success {
  background: rgba(color.$success, 0.95);
}

.toast-warning {
  background: rgba(color.$danger, 0.95);
}

html.dark .toast-info {
  background: color.$gold;
  color: color.$white;
}

.splash-screen {
  position: fixed;
  inset: 0;
  background: color.$gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.splash-content {
  text-align: center;
  color: color.$light;
  animation: splash-in 0.8s ease-out;
}

.splash-logo {
  width: spacing.$spacing-2-xl;
  height: spacing.$spacing-2-xl;
  border-radius: size.$sp20;
  animation: splash-bounce 1.5s ease-in-out infinite;
}

.splash-title {
  @include typography.headline-360-medium;
  margin-top: spacing.$spacing-xs;
  letter-spacing: -0.02em;
}

.splash-divider {
  padding: 0 spacing.$spacing-s;
}

.splash-description {
  @include typography.headline-160;
  opacity: 0.9;
  margin-top: spacing.$spacing-xxs;
}

.splash-dots {
  display: flex;
  justify-content: center;
  gap: spacing.$spacing-xxs;
  margin-top: spacing.$spacing-s;
}

.dot {
  width: spacing.$spacing-xxs;
  height: spacing.$spacing-xxs;
  border-radius: 50%;
  background: rgba(color.$light, 0.6);
  animation: dot-pulse 1.4s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes splash-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(size.$sp20);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes splash-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(size.$sp10 * -1);
  }
}

@keyframes dot-pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.splash-fade-leave-active {
  transition: opacity 0.5s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}

.empty-state {
  text-align: center;
  @include typography.headline-160;
  color: color.$muted-lighter;
  margin-top: spacing.$spacing-s;
}
</style>
