// Employee cost calculator interface. Formulas and 2026 tax rates live in tool-formulas.js.
(function () {
  'use strict';
  const { Employee } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Employee || !T) return;
  T.mount({
    icon: 'users',
    name: 'Employee Cost Calculator', file: 'employee-cost-calculation', storeKey: 'stackrow:employee:v1',
    modeNames: { salary: 'Salaried', hourly: 'Hourly' },
    example: { mode: 'salary', values: { salary: '85000', hours: '2080', sui: '2.7', suibase: '7000', health: '650', retire: '4', other: '600', overhead: '3000' } },
    compute(c, { money, viz }) {
      let wages, hours;
      if (c.mode === 'hourly') {
        const rate = c.number('rate', { required: true, label: 'an hourly wage' });
        const week = c.number('week', { required: true, label: 'hours per week', max: 168 });
        const weeks = c.number('weeks', { required: true, label: 'weeks per year', max: 52 });
        if ([rate, week, weeks].some(Number.isNaN)) return null;
        wages = rate * week * weeks; hours = week * weeks;
      } else {
        wages = c.number('salary', { required: true, label: 'an annual salary' });
        hours = c.number('hours', { fallback: 2080, max: 8784 });
        if ([wages, hours].some(Number.isNaN)) return null;
      }
      const sui = c.number('sui', { max: 20 }), suibase = c.number('suibase'), health = c.number('health'), retire = c.number('retire', { max: 100 }), other = c.number('other'), overhead = c.number('overhead');
      if ([sui, suibase, health, retire, other, overhead].some(Number.isNaN)) return null;
      const r = Employee.cost({ wages, stateUiRate: sui, stateUiBase: suibase, health, retirementPct: retire, otherBenefits: other, overhead, hours });
      return {
        nodes: [viz.stack('Annual cost breakdown', [{ label: 'Wages', value: wages, display: money(wages), tone: 'blue' }, { label: 'Employer taxes', value: r.taxes, display: money(r.taxes), tone: 'cyan' }, { label: 'Benefits', value: r.benefits, display: money(r.benefits), tone: 'navy' }, { label: 'Overhead', value: overhead, display: money(overhead), tone: 'slate' }])],
        metrics: [['Total annual cost', money(r.total), 'Wages + employer taxes + benefits + overhead', true], ['Cost multiplier', `${T.formatNumber(r.multiplier, 2)}× wages`], ['Loaded hourly cost', r.hourly === null ? 'Not available' : money(r.hourly)], ['Monthly cost', money(r.monthly)], ['Employer payroll taxes', money(r.taxes), 'Social Security + Medicare + FUTA + state unemployment']],
        lines: [`Hiring at ${money(wages)} in wages costs about ${money(r.total)} a year, or ${T.formatNumber(r.multiplier, 2)} times pay.`, `Taxes: Social Security ${money(r.ss)}, Medicare ${money(r.medicare)}, FUTA ${money(r.futa)}, state unemployment ${money(r.sui)}.`],
        warning: wages > Employee.SS_WAGE_BASE ? 'Wages above the 2026 Social Security wage base of $184,500 are not subject to the 6.2% employer Social Security tax.' : '',
        inputs: [['Annual wages', money(wages)], ['Paid hours', T.formatNumber(hours, 0)], ['State unemployment rate', T.formatPercent(sui)], ['Health premium per month', money(health)], ['Retirement match', T.formatPercent(retire)], ['Other benefits', money(other)], ['Overhead', money(overhead)]],
        outputs: [['Total annual cost', money(r.total)], ['Employer taxes', money(r.taxes)], ['Benefits', money(r.benefits)], ['Loaded hourly cost', r.hourly === null ? 'Not available' : money(r.hourly)], ['Cost multiplier', T.formatNumber(r.multiplier, 2)]]
      };
    }
  });
})();
