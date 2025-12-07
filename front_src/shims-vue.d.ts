declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

import VueI18n from 'vue-i18n';
import { IconName } from './utils/Icons';

declare module 'vue/types/vue' {
  interface Vue {
    $getIcon(name: IconName): string;
    $t: typeof VueI18n.prototype.t;
    $tc: typeof VueI18n.prototype.tc;
    $te: typeof VueI18n.prototype.te;
    $d: typeof VueI18n.prototype.d;
    $n: typeof VueI18n.prototype.n;
    $i18n: VueI18n;
  }
}
