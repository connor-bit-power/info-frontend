# 🏷️ Category Filter Implementation

## Overview

Added a category/tags filter to the Calendar component using a PillButton dropdown UI. Users can filter events by category to focus on specific types of content.

## Components

### `CategoryFilter.tsx`
New component that provides a dropdown filter UI using PillButton.

**Features:**
- PillButton with icon and label showing selected category
- Dropdown menu with all available categories
- Click outside to close
- Visual indicator for selected category
- Smooth animations

**Available Categories:**
- 📊 **All** - Show all events (default)
- 🏆 **Sports** - All sports events (NFL, NBA, MLB, NHL, Soccer, MMA)
- 🏈 **NFL** - NFL games only
- 🏀 **NBA** - NBA games only
- ⚾ **MLB** - MLB games only
- 🏒 **NHL** - NHL games only
- ⚽ **Soccer** - Soccer matches only
- 🥊 **MMA/UFC** - MMA/UFC fights only
- 🏛️ **Politics** - Political prediction markets
- ₿ **Crypto** - Crypto-related markets
- 💼 **Business** - Business & finance markets
- 🎬 **Entertainment** - Entertainment markets

## Integration

### Calendar.tsx Updates

1. **Import CategoryFilter**:
```typescript
import CategoryFilter, { CATEGORIES } from './CategoryFilter';
```

2. **Add State**:
```typescript
const [selectedCategory, setSelectedCategory] = useState('all');
```

3. **Filter Events**:
```typescript
// Combine all events
const allEvents = useMemo(() => [
  ...generalEvents, ...nflEvents, ...nbaEvents, ...mlbEvents,
  ...nhlEvents, ...soccerEvents, ...mmaEvents
], [...deps]);

// Filter based on category
const events = useMemo(() => {
  if (selectedCategory === 'all') return allEvents;
  
  const category = CATEGORIES.find(c => c.id === selectedCategory);
  if (!category?.tagIds) return allEvents;
  
  return allEvents.filter(event =>
    event.tags?.some(tag => category.tagIds?.includes(tag.id))
  );
}, [allEvents, selectedCategory]);
```

4. **Add to Header**:
```typescript
<CategoryFilter
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  isDarkMode={isDarkMode}
/>
```

## Tag IDs Reference

Sports tag IDs from Polymarket Gamma API:
- **NFL**: 450
- **NBA**: 745
- **MLB**: 3420
- **NHL**: 3421
- **Soccer**: 20693
- **MMA/UFC**: 101049

## How It Works

1. **User clicks PillButton** → Dropdown opens
2. **User selects category** → Filter updates, dropdown closes
3. **Events are filtered** → Only events with matching tags are shown
4. **Calendar updates** → Re-renders with filtered events

## Filtering Logic

- **Sports categories**: Filter by specific tag IDs
- **"All" category**: Show all events (no filtering)
- **Non-sports categories** (Politics, Crypto, etc.): Currently show all non-sports events (tag IDs to be added)

## UI/UX Features

- ✅ Icon + label in pill button
- ✅ Dropdown arrow that rotates when open
- ✅ Smooth animations and transitions
- ✅ Click outside to close
- ✅ Visual hover states
- ✅ Checkmark for selected item
- ✅ Backdrop blur effect
- ✅ Dark/light mode support

## Example Usage

```typescript
// User selects "NFL"
// Calendar now shows only NFL games (tag_id: 450)
// All other events are filtered out

// User selects "Sports"  
// Calendar shows all sports (NFL, NBA, MLB, NHL, Soccer, MMA)

// User selects "All"
// Calendar shows everything (sports + prediction markets)
```

## Future Enhancements

- Add tag IDs for non-sports categories (Politics, Crypto, Business, Entertainment)
- Add "Custom" category where users can select multiple tags
- Add tag search/filter in dropdown
- Remember last selected category (localStorage)
- Add keyboard navigation (arrow keys, Enter, Escape)

