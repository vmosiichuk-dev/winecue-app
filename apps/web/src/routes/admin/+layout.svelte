<script lang="ts">
</script>

<div class="admin-layout">
  <nav>
    <a href="/admin">Dashboard</a>
    <a href="/admin/rules">Rules</a>
    <a href="/admin/import">Import</a>
    <a href="/admin/wines">Wines</a>
  </nav>
  <slot />
</div>

<style>
  .admin-layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding: var(--space-lg);
  }
  nav {
    display: flex;
    gap: var(--space-md);
  }
</style>
