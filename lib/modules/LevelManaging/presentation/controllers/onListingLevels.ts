import { type Level } from "~/lib/modules/LevelManaging/dtos/Level"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"

export const onListingLevels = async (groupId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/levels`.replace(":groupId", groupId)
    const params = { page: 1, search: "" }
    try {
        const {
            data: {
                payload: { levels },
            },
        } = await axios.get<{ payload: { levels: Level[] } }>(uri, { params })
        return levels
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
