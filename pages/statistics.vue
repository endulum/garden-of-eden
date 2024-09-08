<template>
  <div class="space-y-4 max-w-full">
    <h1>Statistics</h1>
    <section class="max-w-prose">
      <p>
        The Garden of Eden takes plant growth very seriously. That's why
        statistics are logged continuously throughout the day to ensure optimum
        health of the plants.
      </p>
      <p class="text-xs text-right italic">All times shown local to you.</p>
    </section>

    <section v-if="statisticsLoaded" class="space-y-8">
      <figure v-if="dragons" class="graph">
        <input type="date" />
        <div class="h-[31rem]">
          <Line
            :data="dragons"
            class="w-full"
            :options="{
              normalized: true,
              plugins: {
                title: {
                  text: 'Dragons in Garden',
                },
                legend: {
                  display: false,
                },
              },
            }"
          />
        </div>
        <figcaption>Data taken in 30 minute intervals.</figcaption>
      </figure>

      <figure v-if="scrolls" class="graph">
        <div class="h-[31rem]">
          <Line
            class="w-full"
            :data="scrolls"
            :options="{
              normalized: true,
              plugins: {
                title: {
                  text: 'Scrolls with Dragons',
                },
                legend: {
                  display: false,
                },
              },
            }"
          />
        </div>
        <figcaption>Data taken in 30 minute intervals.</figcaption>
      </figure>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { ChartData } from 'chart.js';
import { Line } from 'vue-chartjs';

useHead({
  title: 'Statistics',
});

const dragons = ref<ChartData<'line'>>();
const scrolls = ref<ChartData<'line'>>();

const statisticsLoaded = ref(false);

const { data: stats, execute: fetchStats } = useAsyncData(() =>
  $fetch('/api/statistics')
);

function chartColourPalette(palette: string) {
  const defaultPalette = [
    '#ffe100',
    '#f29c4c',
    '#f2a2c4',
    '#f2c4c4',
    '#690033',
    '#007b80',
  ];

  return (
    {
      mint: defaultPalette,
      dark: ['#690033', '#007b80', '#f2c94c', '#f29c4c', '#f2a2c4', '#f2c4c4'],
    }[palette] ?? defaultPalette
  );
}

onNuxtReady(async () => {
  await fetchStats();
  renderCharts();
  statisticsLoaded.value = true;
});

watch(() => useColorMode().value, renderCharts);

function renderCharts() {
  const statistics = stats.value;

  if (statistics === null) return;

  const colours = chartColourPalette(useColorMode().value);

  console.log(toValue(statistics).dragons);

  dragons.value = {
    labels: Object.keys(statistics.dragons).map((dataPoint) => {
      return new Date(parseInt(dataPoint)).toLocaleTimeString();
    }),

    datasets: [
      {
        label: 'Dragons',
        backgroundColor: colours[0],
        borderColor: colours[0],
        data: Object.values(statistics.dragons),
      },
    ],
  };

  scrolls.value = {
    datasets: [
      {
        label: 'Scrolls',
        backgroundColor: colours[1],
        borderColor: colours[1],
        data: statistics.scrolls,
      },
    ],
  };
}
</script>

<style scoped lang="postcss">
.graph {
  & div {
    @apply p-3 border border-green-300 dark:border-stone-700 bg-black/25;
  }

  & figcaption {
    @apply text-xs text-right italic mt-2;
  }
}
</style>
