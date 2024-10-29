<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { PageSizes } from "~/lib/constants"
import { onListingLevels } from "~/lib/modules/LevelManaging/presentation/controllers/onListingLevels"
import { type Level } from "~/lib/modules/LevelManaging/dtos/Level"
import LevelForm from "~/components/groups/[groupId]/levels/LevelForm.vue"
import { performConfirm } from "~/composables/utils/useConfirm"
import { onRemovingLevel } from "~/lib/modules/LevelManaging/presentation/controllers/onRemovingLevel"

definePageMeta({
    name: Pages.Levels.name,
})

const itemsPerPage = PageSizes.Unlimited
const itemLength = ref(0)
const loading = ref(false)
const levels = ref([] as Level[])
const route = useRoute()
const { groupId } = route.params as { groupId: string }
const search = ref(String(route.query["search"] || ""))

const headers = [
    {
        title: '級別',
        sortable: false,
        key: 'order',
    },
    {
        title: '級別名稱',
        sortable: false,
        key: 'name',
    },
    {
        title: '分級說明',
        sortable: false,
        key: 'description',
    },
    {
        title: '',
        sortable: false,
        key: 'ops',
        align: 'end' as 'end',
    },
]


onBeforeMount(async () => {
    levels.value = await onListingLevels(groupId)
})

const items = computed(() =>
    levels.value.filter(({ name, description }) => {
        if (!search.value) return true
        if (name.includes(search.value)) return true
        if (description.includes(search.value)) return true
        return false
    })
)

const reload = async () => {
    loading.value = true
    levels.value = await onListingLevels(groupId)
    loading.value = false
}

const form = ref<InstanceType<typeof LevelForm>>() as Ref<InstanceType<typeof LevelForm>>
const onDeleteButtonClicked = (levelId: string) => performConfirm(
    `刪除分級`,
    `確定要刪除嗎？`,
    async () => {
        await onRemovingLevel(groupId, levelId)
        reload()
    },
)
</script>

<template>
    <LevelForm :groupId="groupId" :reload="reload" ref="form" />
    <v-container>
        <v-card flat>
            <v-card-actions>
                <v-text-field v-model="search" placeholder="關鍵字" prepend-inner-icon="mdi-magnify" variant="solo-filled"
                    flat hide-details density="compact" single-line />
            </v-card-actions>
            <v-divider />
            <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items"
                :items-length="itemLength" :loading="loading" :search="search" item-value="id" disable-items-per-page
                :page="1" hide-default-footer>
                <template v-slot:item.name="{ item: { name, color } }: { item: Level }">
                    <v-badge :color="color" dot location="left" :offset-x="-16">
                        {{ name }}
                    </v-badge>
                </template>
                <template v-slot:item.description="{ item: { description } }: { item: Level }">
                    <v-expansion-panels :flat="true">
                        <v-expansion-panel>
                            <v-expansion-panel-title>
                                展開
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <pre v-html="description"></pre>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </template>
                <template v-slot:item.ops="{ item: level }: { item: Level }">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="form.open(level)">
                                <template #title>編輯</template>
                            </v-list-item>
                            <v-list-item @click="() => onDeleteButtonClicked(level.id)">
                                <template #title>刪除</template>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-data-table-server>
        </v-card>
    </v-container>
    <v-btn icon="mdi-plus" @click="form.open()" :class="$style['create']"></v-btn>
</template>

<style scoped module>
.create {
    @apply fixed right-4 bottom-4;
}
</style>