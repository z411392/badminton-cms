import { type Level } from "~/lib/modules/LevelManaging/dtos/Level"
import { onListingLevels } from "~/lib/modules/LevelManaging/presentation/controllers/onListingLevels"

export const useLevels = (groupId: string) => {
    const levelsSelected = ref<Level[]>([])
    const levelIdsSelected = computed(() => levelsSelected.value.map(({ id }) => id))
    const levelIds = ref<string[]>([])
    const levelsMap = ref<{ [levelId: string]: Level }>({})
    const levels = computed({
        get: () => levelIds.value.map((levelId) => levelsMap.value[levelId]).filter((level) => Boolean(level)),
        set: (levels: Level[]) => {
            levelIds.value = []
            levelsMap.value = {}
            for (const level of levels) {
                if (typeof levelsMap.value[level.id] !== "undefined") continue
                levelsMap.value[level.id] = level
                levelIds.value.push(level.id)
            }
        },
    })
    onBeforeMount(async () => levels.value = await onListingLevels(groupId))
    return {
        levelIdsSelected,
        levelsSelected,
        levels,
        levelsMap,
    }
}