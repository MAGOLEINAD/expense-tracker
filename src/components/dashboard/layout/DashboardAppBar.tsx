import { AppBar, Toolbar, IconButton, Box, Typography, Button, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { User } from 'firebase/auth';
import { UsdRateDisplay } from '../info/UsdRateDisplay';
import { MonthNavigator } from '../navigation/MonthNavigator';
import { TabSwitcher } from '../navigation/TabSwitcher';
import { UserMenu } from '../menus/UserMenu';
import { MONTHS } from '@/utils';

interface DashboardAppBarProps {
  isMobile: boolean;
  user: User | null;
  selectedMonth: number;
  selectedYear: number;
  usdRates: {
    oficial: { compra: number; venta: number };
    blue: { compra: number; venta: number };
  };
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
      <Toolbar
        sx={{
          minHeight: isMobile ? 56 : 56,
          gap: 1,
          px: 2,
        }}
      >
        {/* Mobile Layout */}
        {isMobile && (
          <>
            {/* Izquierda: Menu hamburguesa */}
            <IconButton
              edge="start"
              color="inherit"
              onClick={onOpenMobileDrawer}
              sx={{
                width: 44,
                height: 44,
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Centro: Controles de mes (centrados con position absolute) */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <IconButton
                onClick={onPreviousMonth}
                sx={{
                  color: 'white',
                  width: 44,
                  height: 44,
                  '&:active': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                  },
                }}
              >
                <ChevronLeftIcon fontSize="medium" />
              </IconButton>

              <Chip
                icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                label={
                  <Typography variant="body2" fontWeight={600}>
                    {MONTHS[selectedMonth - 1]} {selectedYear}
                  </Typography>
                }
                onClick={onOpenDatePicker}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  px: 1.5,
                  height: 36,
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.35)',
                  },
                  '&:active': {
                    bgcolor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                  transition: 'all 0.2s',
                }}
              />

              <IconButton
                onClick={onNextMonth}
                sx={{
                  color: 'white',
                  width: 44,
                  height: 44,
                  '&:active': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                  },
                }}
              >
                <ChevronRightIcon fontSize="medium" />
              </IconButton>
            </Box>

            {/* Derecha: Avatar (con margin-left auto para empujar a la derecha) */}
            <Box sx={{ ml: 'auto' }}>
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
            </Box>
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

            <UsdRateDisplay venta={usdRates.oficial.venta} loading={loadingUsd} onClick={onOpenUsdPopover} />

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
