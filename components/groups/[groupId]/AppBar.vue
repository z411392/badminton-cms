<script lang="ts" setup>
import { type User } from "firebase/auth"
import { onSigningOut } from "~/lib/modules/IdentityAndAccessManaging/presentation/controllers/onSigningOut"

const { toggle, title, user } = defineProps<{
    toggle?: () => void
    title: string
    user: User
}>()
</script>

<template>
    <v-app-bar>
        <template v-if="toggle">
            <v-app-bar-nav-icon variant="text" @click.stop="toggle"></v-app-bar-nav-icon>
            <v-toolbar-title>{{ title }}</v-toolbar-title>
        </template>
        <template #append>
            <v-menu>
                <template #activator="{ props }">
                    <v-btn density="compact" :ripple="false" fab icon v-bind="props">
                        <v-avatar size="32">
                            <template v-if="user.photoURL">
                                <v-img :src="user.photoURL">
                                    <template #error>
                                        <v-sheet style="line-height: 32px;">
                                            {{ user.displayName!.charAt(0) }}
                                        </v-sheet>
                                    </template>
                                </v-img>
                            </template>
                            <template v-else>
                                <v-sheet style="line-height: 32px;">
                                    {{ user.displayName!.charAt(0) }}
                                </v-sheet>
                            </template>
                        </v-avatar>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item @click="onSigningOut">
                        <template #title>登出</template>
                    </v-list-item>
                </v-list>
            </v-menu>
        </template>
    </v-app-bar>
</template>

<style scoped>
.v-app-bar {
    background: rgba(255, 255, 255, 0);
    transition: background 0.3s ease;
}

.v-app-bar.v-toolbar:not(.v-toolbar--flat) {
    @apply shadow-none pr-4 overflow-visible;
    top: 16px !important;
}

.v-app-bar :deep(.v-toolbar__prepend) {
    @apply mr-0;
}

@media (max-width: 600px) {
    .v-app-bar :deep(.v-toolbar__prepend) {
        @apply hidden;
    }
}

.v-toolbar-title {
    @apply text-sm p-0;
}
</style>