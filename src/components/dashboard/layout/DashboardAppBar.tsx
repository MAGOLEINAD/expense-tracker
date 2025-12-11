import { AppBar, Toolbar, IconButton, Box, Typography, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { User } from 'firebase/auth';
import { UsdRateDisplay } from '../info/UsdRateDisplay';
import { MonthNavigator } from '../navigation/MonthNavigator';
import { TabSwitcher } from '../navigation/TabSwitcher';
import { UserMenu } from '../menus/UserMenu';

interface DashboardAppBarProps {
  isMobile: boolean;
  user: User | null;
  selectedMonth: number;
  selectedYear: number;
  usdRates: { compra: number; venta: number };
  loadingUsd: boolean;
  activeTab: number;
  userMenuAnchor: HTMLElement | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenDatePicker: (event: React.MouseEvent<HTMLElement>) => void;
  onOpenTemplate: () => void;
  onToggleTab: () => void;
  onOpenExpenseDialog: () => void;
  onOpenMobileDrawer: () => void;
  onOpenUsdPopover: (event: React.MouseEvent<HTMLElement>) => void;
  onOpenUserMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onCloseUserMenu: () => void;
  onOpenSettings: () => void;
  onOpenStatusColors: () => void;
  onLogout: () => void;
}

export const DashboardAppBar = ({
  isMobile,
  user,
  selectedMonth,
  selectedYear,
  usdRates,
  loadingUsd,
  activeTab,
  userMenuAnchor,
  onPreviousMonth,
  onNextMonth,
  onOpenDatePicker,
  onOpenTemplate,
  onToggleTab,
  onOpenExpenseDialog,
  onOpenMobileDrawer,
  onOpenUsdPopover,
  onOpenUserMenu,
  onCloseUserMenu,
  onOpenSettings,
  onOpenStatusColors,
  onLogout,
}: DashboardAppBarProps) => {
  return (
    <AppBar
      position="sticky"
      elevation={3}
      sx={{
        background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
      }}
    >
      <Toolbar sx={{ minHeight: 56, gap: 2, px: 3 }}>
        {/* Mobile Layout */}
        {isMobile && (
          <>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onOpenMobileDrawer}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
              💰 Gastos
            </Typography>

            <UserMenu
              user={user}
              open={Boolean(userMenuAnchor)}
              anchorEl={userMenuAnchor}
              onOpenMenu={onOpenUserMenu}
              onCloseMenu={onCloseUserMenu}
              onOpenSettings={onOpenSettings}
              onOpenStatusColors={onOpenStatusColors}
              onLogout={onLogout}
              size="small"
            />
          </>
        )}

        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Izquierda: Avatar y Dólar */}
            <UserMenu
              user={user}
              open={Boolean(userMenuAnchor)}
              anchorEl={userMenuAnchor}
              onOpenMenu={onOpenUserMenu}
              onCloseMenu={onCloseUserMenu}
              onOpenSettings={onOpenSettings}
              onOpenStatusColors={onOpenStatusColors}
              onLogout={onLogout}
              size="small"
              showBorder
            />

            <UsdRateDisplay venta={usdRates.venta} loading={loadingUsd} onClick={onOpenUsdPopover} />

            <Box sx={{ flexGrow: 1 }} />

            {/* Centro: Navegación de mes */}
            <MonthNavigator
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPreviousMonth={onPreviousMonth}
              onNextMonth={onNextMonth}
              onOpenDatePicker={onOpenDatePicker}
            />

            <Button
              variant="contained"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={onOpenTemplate}
              size="small"
              sx={{
                textTransform: 'none',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                ml: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                boxShadow: 'none',
              }}
            >
              Template
            </Button>

            <Box sx={{ flexGrow: 1 }} />

            {/* Derecha: Análisis y Nuevo Gasto */}
            <TabSwitcher activeTab={activeTab} onToggle={onToggleTab} />

            <Button
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={onOpenExpenseDialog}
              size="small"
              sx={{
                textTransform: 'none',
                bgcolor: 'white',
                color: '#01579b',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: '#f0f9ff',
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Nuevo Gasto
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};
