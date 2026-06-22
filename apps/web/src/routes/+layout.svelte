<script lang="ts">
import '../app.css';
import { setConvexContext } from '$lib/convex/client.js';

setConvexContext();
</script>

<div class="app">
  <slot />
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>
